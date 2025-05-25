from __future__ import annotations

"""ColPali embedding helper – encapsulates lazy model loading so that
   the heavy VLM is instantiated only once per process.  The class returns
   both the *multi-vector* patch embeddings and the *global* pooled vector
   for a given page image.

   The ColPali model will be downloaded from HuggingFace on first run and
   cached by `huggingface_hub` in ~/.cache/huggingface/.
"""

import os
from pathlib import Path
from typing import Tuple, Sequence

import torch
from PIL import Image

# HuggingFace wrapper around ColPali – available via the `colpali-engine` pypi
from colpali_engine.models import ColPali, ColPaliProcessor

# ---------------------------------------------------------------------------
#  Configuration helpers (read from env so that docker-compose overrides work)
# ---------------------------------------------------------------------------

_DEFAULT_MODEL = os.getenv("COLPALI_MODEL", "vidore/colpali-v1.1")
_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class ColPaliEmbedder:
    """Singleton-style wrapper for ColPali embeddings."""

    _instance: "ColPaliEmbedder | None" = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, model_name: str = _DEFAULT_MODEL, device: str = _DEVICE):
        # Guard against multiple __init__ calls due to singleton pattern
        if hasattr(self, "_initialised") and self._initialised:
            return

        # Processor handles both image & text modalities
        # Enable local-files-only flag if user pre-downloaded the weights (see docs/upgrade-to-100percent-local.md)
        local_only = bool(int(os.getenv("HF_LOCAL_ONLY", "0")))
        self.processor = ColPaliProcessor.from_pretrained(
            model_name,
            use_fast=True,
            local_files_only=local_only,
        )

        # Store target device first so kwargs can reference it
        self.device = device

        # Load the heavy model as memory-efficient as possible on CPU/GPU
        model_kwargs = {
            "low_cpu_mem_usage": True,
            "torch_dtype": torch.float16 if self.device == "cpu" else torch.bfloat16,
            "local_files_only": local_only,
        }

        # ColPali multi-vector retriever model
        self.model = ColPali.from_pretrained(model_name, **model_kwargs)
        self._initialised = True

    @torch.inference_mode()
    def embed_page(self, page_image: Image.Image) -> Tuple[Sequence[float], Sequence[float]]:
        """Return (multi_vectors, global_vector) for a PIL page image.

        multi_vectors is a list/array shaped (num_patches, dim) – typically (196, 128)
        global_vector is the pooled document embedding (dim=128).
        """
        inputs = self.processor.process_images([page_image]).to(self.device)
        # Model returns a tensor of shape (num_patches, dim)
        multi_vecs = self.model(**inputs)[0]  # first (and only) image in batch
        # Derive a lightweight global vector by averaging patch embeddings
        global_vec = multi_vecs.mean(dim=0, keepdim=True)
        # Convert to CPU float32 numpy for interoperability
        return multi_vecs.cpu().float().numpy(), global_vec.squeeze(0).cpu().float().numpy()

    @torch.inference_mode()
    def embed_text(self, text: str) -> Sequence[float]:
        """Return a 128-d global embedding for *text* queries."""
        inputs = self.processor.process_queries([text]).to(self.device)
        query_tokens = self.model(**inputs)[0]  # (num_tokens, dim)
        # Pool to single vector (mean) for ANN search
        global_vec = query_tokens.mean(dim=0)
        return global_vec.cpu().float().numpy()


# Convenience top-level function ------------------------------------------------

def get_colpali_embeddings(page_path: str | Path) -> Tuple[Sequence[float], Sequence[float]]:
    """Utility wrapper -> loads image, delegates to ColPaliEmbedder.embed_page."""
    if isinstance(page_path, str):
        page_path = Path(page_path)
    img = Image.open(page_path).convert("RGB")
    return ColPaliEmbedder().embed_page(img) 