import os
from pathlib import Path
from typing import List, Optional
import numpy as np
from langchain_core.embeddings import Embeddings
from .config import settings, rag_dir

def resolve_model_dir() -> Path:
    """
    Dynamically and portably locates the sentence-transformers/all-MiniLM-L6-v2 ONNX model directory.
    Checks multiple candidate locations:
      1. Explicit EMBEDDING_MODEL_PATH or MINILM_MODEL_PATH setting/environment variable
      2. Local repository model cache at RAG/models/all-MiniLM-L6-v2
      3. User's Hugging Face cache directory (~/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2)
      4. Auto-downloads via huggingface_hub snapshot_download if available
    Fails with a clear, actionable error if unavailable.
    """
    # 1. Check explicit configuration
    explicit_path = settings.EMBEDDING_MODEL_PATH or os.getenv("MINILM_MODEL_PATH") or os.getenv("EMBEDDING_MODEL_PATH")
    if explicit_path:
        p = Path(explicit_path)
        if p.exists() and (p / "tokenizer.json").exists():
            return p

    # 2. Check local repository model directory
    local_dir = rag_dir / "models" / "all-MiniLM-L6-v2"
    if local_dir.exists() and (local_dir / "tokenizer.json").exists():
        return local_dir

    # 3. Dynamic lookup in user Hugging Face hub cache
    hf_cache_dir = Path(os.getenv("HF_HOME", Path.home() / ".cache" / "huggingface")) / "hub"
    model_repo = hf_cache_dir / "models--sentence-transformers--all-MiniLM-L6-v2"
    if model_repo.exists():
        snapshots_dir = model_repo / "snapshots"
        if snapshots_dir.exists():
            snapshots = list(snapshots_dir.glob("*"))
            if snapshots:
                # Pick the latest snapshot with tokenizer.json and onnx model
                for snap in sorted(snapshots, key=lambda s: s.stat().st_mtime, reverse=True):
                    has_tok = (snap / "tokenizer.json").exists()
                    has_onnx = (snap / "onnx" / "model.onnx").exists() or (snap / "model.onnx").exists()
                    if has_tok and has_onnx:
                        return snap

    # 4. Attempt automatic snapshot download via huggingface_hub
    try:
        from huggingface_hub import snapshot_download
        print("[MiniLMEmbeddings] Model not found locally. Attempting automatic download of 'sentence-transformers/all-MiniLM-L6-v2'...")
        downloaded_path = snapshot_download(
            repo_id="sentence-transformers/all-MiniLM-L6-v2",
            ignore_patterns=["*.msgpack", "*.h5", "*.tflite", "*.bin"],
        )
        downloaded = Path(downloaded_path)
        if downloaded.exists() and (downloaded / "tokenizer.json").exists():
            return downloaded
    except Exception as dl_err:
        print(f"[MiniLMEmbeddings] Auto-download failed or unavailable: {dl_err}")

    # 5. Clear, actionable failure
    raise RuntimeError(
        "MiniLM embedding model could not be located.\n"
        "Action required:\n"
        "  1. Ensure internet connection to let huggingface_hub download the model, OR\n"
        "  2. Run: python -c \"from huggingface_hub import snapshot_download; snapshot_download('sentence-transformers/all-MiniLM-L6-v2')\", OR\n"
        "  3. Set the EMBEDDING_MODEL_PATH environment variable to the directory containing tokenizer.json and model.onnx."
    )


class MiniLMEmbeddings(Embeddings):
    """
    High-performance, genuine semantic embedding model powered by
    sentence-transformers/all-MiniLM-L6-v2 running locally via ONNX Runtime.
    Produces normalized 384-dimensional dense semantic vector representations
    with zero external API dependency and sub-2ms query latency.
    """
    def __init__(
        self,
        model_dir: Optional[Path] = None,
        max_seq_length: int = 256,
        batch_size: int = 32,
    ):
        self.model_name = settings.EMBEDDING_MODEL_NAME
        self.dimension = settings.EMBEDDING_DIMENSION
        self.version = settings.EMBEDDING_VERSION
        self.max_seq_length = max_seq_length
        self.batch_size = batch_size

        self.model_dir = Path(model_dir) if model_dir else resolve_model_dir()
        self._tokenizer = None
        self._session = None

        self._initialize_model()

    def _initialize_model(self) -> None:
        """Initializes tokenizer and ONNX inference session."""
        try:
            from tokenizers import Tokenizer
            import onnxruntime as ort

            tokenizer_path = self.model_dir / "tokenizer.json"
            if not tokenizer_path.exists():
                raise FileNotFoundError(f"Tokenizer not found at {tokenizer_path}")

            self._tokenizer = Tokenizer.from_file(str(tokenizer_path))
            self._tokenizer.enable_truncation(max_length=self.max_seq_length)
            self._tokenizer.enable_padding(length=self.max_seq_length)

            # Locate ONNX model
            onnx_path = self.model_dir / "onnx" / "model.onnx"
            if not onnx_path.exists():
                onnx_path = self.model_dir / "model.onnx"
            if not onnx_path.exists():
                raise FileNotFoundError(f"ONNX model file 'model.onnx' not found in {self.model_dir} or {self.model_dir / 'onnx'}")

            # Optimize ONNX runtime options for CPU
            sess_options = ort.SessionOptions()
            sess_options.intra_op_num_threads = min(4, os.cpu_count() or 1)
            sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

            self._session = ort.InferenceSession(
                str(onnx_path),
                sess_options=sess_options,
                providers=["CPUExecutionProvider"],
            )
            print(f"[MiniLMEmbeddings] Loaded semantic model '{self.model_name}' (dim={self.dimension}) successfully from {self.model_dir.name}.")
        except Exception as e:
            print(f"[MiniLMEmbeddings] ERROR initializing local ONNX model: {e}")
            raise

    def _mean_pooling(
        self, token_embeddings: np.ndarray, attention_mask: np.ndarray
    ) -> np.ndarray:
        """Applies attention-weighted mean pooling and L2 normalization."""
        mask_expanded = np.expand_dims(attention_mask, -1).astype(float)
        sum_embeddings = np.sum(token_embeddings * mask_expanded, axis=1)
        sum_mask = np.clip(mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
        pooled = sum_embeddings / sum_mask

        # L2-normalization to ensure cosine similarity equals dot product
        norms = np.linalg.norm(pooled, ord=2, axis=1, keepdims=True)
        normalized = pooled / np.clip(norms, a_min=1e-12, a_max=None)
        return normalized

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generates dense semantic embeddings for a batch of documents."""
        if not texts:
            return []

        all_embeddings: List[List[float]] = []

        # Process in batches to avoid high memory spikes
        for i in range(0, len(texts), self.batch_size):
            batch = [t if isinstance(t, str) and t.strip() else "empty document" for t in texts[i : i + self.batch_size]]
            encodings = self._tokenizer.encode_batch(batch)

            input_ids = np.array([e.ids for e in encodings], dtype=np.int64)
            attention_mask = np.array([e.attention_mask for e in encodings], dtype=np.int64)
            token_type_ids = np.array([e.type_ids for e in encodings], dtype=np.int64)

            outputs = self._session.run(
                None,
                {
                    "input_ids": input_ids,
                    "attention_mask": attention_mask,
                    "token_type_ids": token_type_ids,
                },
            )
            token_embeddings = outputs[0]
            pooled = self._mean_pooling(token_embeddings, attention_mask)

            for vec in pooled:
                vec_list = vec.tolist()
                assert len(vec_list) == self.dimension, f"Vector dimension mismatch: got {len(vec_list)}, expected {self.dimension}"
                all_embeddings.append(vec_list)

        return all_embeddings

    def embed_query(self, text: str) -> List[float]:
        """Generates a dense semantic embedding for a single user query."""
        clean_text = text.strip() if isinstance(text, str) and text.strip() else "empty query"
        encoding = self._tokenizer.encode(clean_text)

        input_ids = np.array([encoding.ids], dtype=np.int64)
        attention_mask = np.array([encoding.attention_mask], dtype=np.int64)
        token_type_ids = np.array([encoding.type_ids], dtype=np.int64)

        outputs = self._session.run(
            None,
            {
                "input_ids": input_ids,
                "attention_mask": attention_mask,
                "token_type_ids": token_type_ids,
            },
        )
        token_embeddings = outputs[0]
        pooled = self._mean_pooling(token_embeddings, attention_mask)
        vec = pooled[0].tolist()

        assert len(vec) == self.dimension, f"Vector dimension mismatch: got {len(vec)}, expected {self.dimension}"
        return vec


def get_embeddings_model(provider: Optional[str] = None) -> Embeddings:
    """
    Factory function returning the configured production embedding model.
    Decoupled from the LLM provider to ensure vector dimensions remain
    consistent across indexing and retrieval.
    Defaults to the local, zero-latency MiniLM-L6-v2 ONNX embedder (384 dimensions).
    """
    selected_provider = (provider or settings.EMBEDDING_PROVIDER).lower()

    if selected_provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise ValueError("OpenAI embeddings requested, but OPENAI_API_KEY is not configured.")
        try:
            from langchain_openai import OpenAIEmbeddings
            print(f"[Embeddings] Using OpenAI Embeddings ({settings.OPENAI_EMBEDDING_MODEL}).")
            embedder = OpenAIEmbeddings(
                model=settings.OPENAI_EMBEDDING_MODEL,
                api_key=settings.OPENAI_API_KEY,
            )
            return embedder
        except Exception as e:
            print(f"[Embeddings] Failed to initialize OpenAI Embeddings: {e}")
            raise

    if selected_provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise ValueError("Gemini embeddings requested, but GEMINI_API_KEY is not configured.")
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            print(f"[Embeddings] Using Gemini Embeddings ({settings.GEMINI_EMBEDDING_MODEL}).")
            return GoogleGenerativeAIEmbeddings(
                model=settings.GEMINI_EMBEDDING_MODEL,
                google_api_key=settings.GEMINI_API_KEY,
            )
        except Exception as e:
            print(f"[Embeddings] Failed to initialize Gemini Embeddings: {e}")
            raise

    if selected_provider in ("minilm", "local", "sentence-transformers"):
        # Primary production embedding model
        return MiniLMEmbeddings()

    raise ValueError(
        f"Unsupported embedding provider: '{selected_provider}'. "
        f"Supported providers: 'minilm' (default, 384 dims), 'openai', 'gemini'."
    )
