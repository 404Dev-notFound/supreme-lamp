"""
app.py
-------
Flask backend for the RAG Resume Screener.

Pipeline for POST /api/analyze:
  1. Receive an uploaded PDF resume.
  2. Extract real text + structural signals (resume_parser.py).
  3. Retrieve grounded, relevant screening guidelines from the local
     knowledge base via TF-IDF RAG (rag_engine.py).
  4. Send resume text + structural signals + retrieved guidelines to a
     free LLM on Groq (fast, free-tier friendly) and require a strict
     JSON verdict back.
  5. Return that verdict to the frontend. No hardcoded/fake results --
     if the LLM call fails or no API key is configured, a real error is
     returned instead of a fabricated analysis.
"""

import os
import json
import traceback

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq

from resume_parser import extract_text_from_pdf
from rag_engine import ResumeRAG

load_dotenv()

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

rag = ResumeRAG()

MAX_FILE_SIZE_MB = 8

SYSTEM_PROMPT = """You are a senior technical recruiter and ATS (Applicant Tracking System) specialist \
with 15+ years of experience screening resumes at top tech companies. You are strict, specific, and \
evidence-based. You NEVER invent details that are not present in the resume text given to you. \
You ground every judgment either in the resume text itself, the measured document signals provided, \
or the recruiting/ATS guidelines provided to you as reference context.

You must respond with ONLY a single valid JSON object -- no markdown fences, no preamble, no commentary \
outside the JSON. The JSON must match this exact schema:

{
  "overall_score": <integer 0-100>,
  "verdict": "<one of: 'Likely Accepted', 'Borderline', 'Likely Rejected'>",
  "verdict_reason": "<1-2 sentence plain-language summary of the verdict>",
  "ats_compatibility": {
    "score": <integer 0-100>,
    "issues": ["<specific ATS parsing risk found in THIS resume, or empty list if none>"]
  },
  "strengths": [
    {"point": "<specific strength>", "why_it_matters": "<why a recruiter would value this>"}
  ],
  "flaws": [
    {"issue": "<specific flaw found in THIS resume>", "severity": "<'Critical' or 'Major' or 'Minor'>", "fix": "<concrete, actionable fix>"}
  ],
  "missing_quantification_examples": ["<a bullet from the resume that lacks metrics, rewritten with a plausible metric placeholder to show the candidate the pattern, clearly marked as an example>"],
  "section_feedback": {
    "summary": "<feedback or 'Not present' if missing>",
    "experience": "<feedback>",
    "skills": "<feedback>",
    "education": "<feedback>",
    "formatting": "<feedback>"
  },
  "top_3_priority_fixes": ["<the single most important fix>", "<second most important>", "<third most important>"]
}

Scoring guidance:
- 85-100 = Likely Accepted: strong quantified impact, clean ATS-safe formatting, no critical flaws.
- 50-84 = Borderline: solid foundation but has real gaps (weak quantification, some formatting risk, thin sections).
- 0-49 = Likely Rejected: critical ATS parsing risks, no measurable achievements, major red flags, or missing essentials.

Be specific and cite what you actually see in the resume text (mention real company names, real bullet phrasing, \
real numbers if present) rather than generic advice. If the resume is genuinely strong, say so plainly and do not \
invent flaws just to fill the list -- an empty or short flaws list for a genuinely strong resume is correct behavior.
"""


def build_user_prompt(resume_text: str, signal_block: str, rag_context: str) -> str:
    return f"""RESUME TEXT (raw extracted text, exactly as parsed from the uploaded PDF):
---
{resume_text}
---

MEASURED DOCUMENT SIGNALS (computed directly from the file, not guessed):
---
{signal_block}
---

RETRIEVED SCREENING GUIDELINES (grounding context retrieved from a recruiter/ATS knowledge base, \
relevant to this specific resume -- use these to justify your judgments, citing the rule id in parentheses \
where it directly supports a flaw or strength):
---
{rag_context}
---

Now produce the JSON verdict as instructed in the system prompt. Base every claim on the resume text and \
signals above. Do not fabricate employers, dates, or numbers that are not in the resume text."""


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "groq_key_configured": bool(GROQ_API_KEY),
        "model": GROQ_MODEL,
    })


@app.route("/api/analyze", methods=["POST"])
def analyze():
    if not GROQ_API_KEY:
        return jsonify({
            "error": "GROQ_API_KEY is not configured on the server. "
                     "Get a free key at https://console.groq.com/keys and set it in backend/.env "
                     "as GROQ_API_KEY=your_key_here, then restart the server."
        }), 500

    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded. Send a PDF under the 'resume' form field."}), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported."}), 400

    file.stream.seek(0, os.SEEK_END)
    size_mb = file.stream.tell() / (1024 * 1024)
    file.stream.seek(0)
    if size_mb > MAX_FILE_SIZE_MB:
        return jsonify({"error": f"File too large ({size_mb:.1f}MB). Max is {MAX_FILE_SIZE_MB}MB."}), 400

    try:
        parsed = extract_text_from_pdf(file.stream)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 422
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Could not read this PDF. It may be corrupted or password-protected."}), 422

    rag_context = rag.as_prompt_context(parsed.raw_text)
    signal_block = parsed.to_signal_block()
    user_prompt = build_user_prompt(parsed.raw_text, signal_block, rag_context)

    try:
        client = Groq(api_key=GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=3000,
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"LLM request to Groq failed: {str(e)}"}), 502

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        return jsonify({"error": "Model did not return valid JSON. Please try again.", "raw": content}), 502

    result["_meta"] = {
        "model_used": GROQ_MODEL,
        "page_count": parsed.page_count,
        "word_count": parsed.word_count,
        "bullet_count": parsed.bullet_count,
        "metric_mentions_found": parsed.metric_count,
        "sections_recognized": parsed.sections_found,
    }

    return jsonify(result), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
