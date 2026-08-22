"""
resume_parser.py
------------------
Extracts raw text and real structural signals from an uploaded PDF resume.

These signals (word count, bullet count, presence/absence of quantified
metrics, contact-info detection, section headers found, etc.) are computed
directly from the actual document -- not guessed by the LLM -- and are
passed into the prompt alongside the RAG context so the model's judgment
is grounded in measurable facts about the specific file that was uploaded.
"""

import re
import pdfplumber

SECTION_KEYWORDS = [
    "experience", "work experience", "employment", "professional experience",
    "education", "skills", "technical skills", "projects", "certifications",
    "summary", "objective", "achievements", "awards", "publications",
    "volunteer", "leadership", "languages", "interests",
]

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(\+?\d{1,3}[\s.-]?)?(\(?\d{3,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}")
LINKEDIN_RE = re.compile(r"linkedin\.com/in/[A-Za-z0-9\-_/]+", re.IGNORECASE)
GITHUB_RE = re.compile(r"github\.com/[A-Za-z0-9\-_/]+", re.IGNORECASE)
URL_RE = re.compile(r"https?://[^\s)]+")
METRIC_RE = re.compile(r"(\$\d[\d,]*\.?\d*\+?|\d+(\.\d+)?\s?%|\b\d{2,}\+?\s?(users|clients|hours|projects|people|members|engineers|countries)\b)", re.IGNORECASE)
BULLET_RE = re.compile(r"^\s*[•\-\*▪●○◦‣∙]\s+", re.MULTILINE)
CID_ARTIFACT_RE = re.compile(r"\(cid:\d+\)\s*")

WEAK_VERBS = ["responsible for", "helped with", "worked on", "was tasked with", "in charge of"]


class ParsedResume:
    def __init__(self, raw_text: str, page_count: int):
        self.raw_text = raw_text
        self.page_count = page_count
        self.word_count = len(raw_text.split())
        self.bullet_count = len(BULLET_RE.findall(raw_text))
        self.has_email = bool(EMAIL_RE.search(raw_text))
        self.has_phone = bool(PHONE_RE.search(raw_text))
        self.has_linkedin = bool(LINKEDIN_RE.search(raw_text))
        self.has_github = bool(GITHUB_RE.search(raw_text))
        self.other_links = [u for u in URL_RE.findall(raw_text) if "linkedin" not in u.lower() and "github" not in u.lower()]
        self.metric_mentions = METRIC_RE.findall(raw_text)
        self.metric_count = len(self.metric_mentions)
        self.sections_found = sorted({
            kw for kw in SECTION_KEYWORDS if re.search(rf"\b{re.escape(kw)}\b", raw_text, re.IGNORECASE)
        })
        self.weak_phrase_hits = [w for w in WEAK_VERBS if w in raw_text.lower()]

    def to_signal_block(self) -> str:
        """A compact, factual summary of the document that gets fed to the LLM."""
        lines = [
            f"Page count: {self.page_count}",
            f"Total word count: {self.word_count}",
            f"Bullet points detected: {self.bullet_count}",
            f"Email address detected: {'yes' if self.has_email else 'NO'}",
            f"Phone number detected: {'yes' if self.has_phone else 'NO'}",
            f"LinkedIn URL detected: {'yes' if self.has_linkedin else 'no'}",
            f"GitHub/portfolio URL detected: {'yes' if self.has_github else 'no'}",
            f"Other links detected: {len(self.other_links)}",
            f"Quantified metrics found (numbers/%/$/scale words): {self.metric_count}",
            f"Section headers recognized: {', '.join(self.sections_found) if self.sections_found else 'NONE RECOGNIZED'}",
            f"Weak/passive phrases found: {', '.join(self.weak_phrase_hits) if self.weak_phrase_hits else 'none'}",
        ]
        return "\n".join(lines)


def extract_text_from_pdf(file_stream) -> ParsedResume:
    """
    file_stream: a file-like object (e.g. from Flask's request.files['resume'].stream
    or an open('rb') file handle) containing PDF bytes.
    """
    text_parts = []
    with pdfplumber.open(file_stream) as pdf:
        page_count = len(pdf.pages)
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_parts.append(page_text)

    raw_text = "\n".join(text_parts).strip()

    # Some PDF generators (e.g. certain design tools, or symbol-font bullet glyphs)
    # produce "(cid:N)" artifacts instead of a real character when text is extracted.
    # Treat those as bullet markers so bullet-count detection still works, then strip
    # them so the LLM isn't confused by raw font-encoding noise.
    raw_text = CID_ARTIFACT_RE.sub("- ", raw_text)

    if not raw_text:
        raise ValueError(
            "No extractable text found in this PDF. It may be a scanned image "
            "or built entirely from graphics, which most ATS systems also cannot read. "
            "This is itself an important ATS-compatibility flaw worth flagging to the user."
        )

    return ParsedResume(raw_text=raw_text, page_count=page_count)
