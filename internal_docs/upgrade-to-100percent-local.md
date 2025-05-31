# ColPali — 100 % Offline Deployment Guide

_Last updated: 2025-05-22_

This note describes **three ways to remove the last external dependency** (the
initial Hugging Face model download) so the DocAI-IMAGE stack can run in a
completely air-gapped environment.

---

## 0 · Background
The first time the backend container needs the ColPali model it calls
`huggingface_hub` which fetches two `.safetensors` files (~2 GB total).  After
that they live in `/root/.cache/huggingface/…` inside the container and no
further network traffic is required.

The log warnings you may see are harmless:

* _"slow image processor …"_ – we load the (slower) Python tokenizer.  Passing
  `use_fast=True` activates the Rust implementation (~10 % faster).
* _"Xet Storage is enabled … hf_xet not installed"_ – HF tries to use its
  optional large-file accelerator and falls back to HTTPS when the helper
  package is missing.

---

## 1 · Bake the Model into the Backend Image (most portable)
1. Add the following to **`src/backend/Dockerfile`** _before_ the final `COPY . .`:
   ```dockerfile
   # ------------------------------------------------------------------
   # Pre-download ColPali weights → image layer
   # ------------------------------------------------------------------
   RUN apt-get update && apt-get install -y git-lfs && rm -rf /var/lib/apt/lists/* \
       && git lfs install --skip-smudge \
       && git clone https://huggingface.co/vidore/colpali-v1.1 /opt/colpali \
       && git -C /opt/colpali lfs pull --include "*.safetensors"

   ENV HF_HOME=/opt  # tells huggingface_hub to look here first
   ```
2. Patch **`app/colpali_embedder.py`** to load **local-only**:
   ```python
   MODEL_PATH = Path("/opt/colpali")
   self.processor = ColPaliProcessor.from_pretrained(
       MODEL_PATH, use_fast=True, local_files_only=True
   )
   self.model = ColPali.from_pretrained(MODEL_PATH, local_files_only=True)
   ```

Result: the backend image is self-contained; the first boot works offline.
Image size ≈ 3 GB.

---

## 2 · Bind-Mount a Host Cache (lighter image)
1. On the host machine: `mkdir -p ~/.hf-cache`
2. Add to **`docker-compose.yml`** under `backend`:
   ```yaml
   volumes:
     - ~/.hf-cache:/root/.cache/huggingface
   ```
3. Run the stack **once** with internet so the cache is populated.  Afterwards
   copy `~/.hf-cache` to any offline host; the container will find the files.

Pros: image stays slim; easy to update model version.  Cons: requires a
one-time connected run.

---

## 3 · Keep Current Online-First Behaviour (simple)
Do nothing.  The backend downloads the weights the first time and caches them
inside the container layer; rest of execution is fully local.

---

## Optional Tweaks
• **Silence Xet warnings**   `pip install 'huggingface_hub[hf_xet]'` _or_
  set `HF_HUB_DISABLE_XET=1` in the environment.

• **Turn on fast processor**   pass `use_fast=True` when loading the processor
  for ~10 % faster image preprocessing.

---
© DMS Team 