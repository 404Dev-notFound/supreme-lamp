"""
rag_engine.py
--------------
A small, real, working Retrieval-Augmented Generation engine.

Instead of calling an external embeddings API (which would need another
paid/free key and network dependency), this uses scikit-learn's TF-IDF
vectorizer + cosine similarity to retrieve the most relevant resume
best-practice rules from knowledge_base.json for the *specific* resume
text that was uploaded. Those retrieved rules are then injected into the
LLM prompt as grounding context, which is what makes this a genuine RAG
pipeline rather than a bare "send resume to LLM and hope" call.

Retrieval is done PER CATEGORY (ATS_FORMATTING, CONTENT_IMPACT, SKILLS,
EXPERIENCE, EDUCATION, RED_FLAGS, SUMMARY_CONTACT) so the LLM always
receives balanced coverage across every dimension recruiters actually
check, instead of only the dimensions that happen to score highest by
raw similarity.
"""

import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_KB_PATH = os.path.join(os.path.dirname(__file__), "knowledge_base.json")

CATEGORIES = [
    "ATS_FORMATTING",
    "CONTENT_IMPACT",
    "SKILLS",
    "EXPERIENCE",
    "EDUCATION",
    "RED_FLAGS",
    "SUMMARY_CONTACT",
]

TOP_K_PER_CATEGORY = 3


class ResumeRAG:
    def __init__(self, kb_path: str = _KB_PATH):
        with open(kb_path, "r", encoding="utf-8") as f:
            self.chunks = json.load(f)

        self.texts = [c["text"] for c in self.chunks]
        # A single TF-IDF space fit across the whole knowledge base gives
        # every chunk a comparable vector representation.
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.matrix = self.vectorizer.fit_transform(self.texts)

        # Pre-split indices by category for fast per-category retrieval.
        self.category_indices = {cat: [] for cat in CATEGORIES}
        for i, c in enumerate(self.chunks):
            self.category_indices.setdefault(c["category"], []).append(i)

    def retrieve(self, resume_text: str, top_k_per_category: int = TOP_K_PER_CATEGORY):
        """
        Returns a dict: {category: [ {id, category, text, score}, ... ]}
        retrieved by cosine similarity between the resume text and each
        knowledge base chunk, computed separately within each category.
        """
        query_vec = self.vectorizer.transform([resume_text])
        results = {}

        for cat in CATEGORIES:
            idxs = self.category_indices.get(cat, [])
            if not idxs:
                results[cat] = []
                continue

            sub_matrix = self.matrix[idxs]
            sims = cosine_similarity(query_vec, sub_matrix)[0]

            ranked = sorted(zip(idxs, sims), key=lambda x: x[1], reverse=True)
            top = ranked[:top_k_per_category]

            results[cat] = [
                {
                    "id": self.chunks[i]["id"],
                    "category": self.chunks[i]["category"],
                    "text": self.chunks[i]["text"],
                    "score": round(float(score), 4),
                }
                for i, score in top
            ]

        return results

    def as_prompt_context(self, resume_text: str) -> str:
        """Flatten retrieved chunks into a single grounding block for the LLM prompt."""
        retrieved = self.retrieve(resume_text)
        lines = []
        for cat, chunks in retrieved.items():
            if not chunks:
                continue
            lines.append(f"\n[{cat.replace('_', ' ')}]")
            for c in chunks:
                lines.append(f"- ({c['id']}, relevance={c['score']}) {c['text']}")
        return "\n".join(lines)


if __name__ == "__main__":
    # Quick manual sanity check
    rag = ResumeRAG()
    sample = "Managed team, responsible for sales, worked with Excel and PowerPoint."
    print(rag.as_prompt_context(sample))
