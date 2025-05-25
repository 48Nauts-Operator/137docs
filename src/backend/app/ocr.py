"""
OCR and document processing module for the Document Management System.
"""
import os
import pytesseract
import logging
import asyncio
from typing import List, Optional

# -----------------------------------------------
# Heavy-weight libraries imported lazily to avoid
# unnecessary startup cost and to keep memory
# overhead low until actually required.
# -----------------------------------------------
from PIL import Image

# pdfplumber (light-weight, pure-python) is used first to grab any embedded
# text.  Only if a page contains **no** extractable text do we fall back to
# rasterising that single page and running OCR on the pixels.  This avoids
# running the much heavier `pdf2image` / poppler pipeline on every page of
# digital-native PDFs, which in practice eliminates the segmentation-faults
# we were seeing inside the poppler C-libs (container exits with code 139).

import io
import importlib

# Lazy-import helpers ------------------------------------------------------

def _lazy_import(module_name: str):
    """Import *module_name* only when first needed (and memoise)."""
    module = importlib.import_module(module_name)
    globals()[module_name] = module  # cache at module level for re-use
    return module

logger = logging.getLogger(__name__)

class OCRProcessor:
    """Handles OCR processing for documents."""
    
    async def process_document(self, file_path: str) -> str:
        """
        Process a document file with OCR to extract text.
        
        Args:
            file_path: Path to the document file
            
        Returns:
            Extracted text from the document
        """
        file_extension = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_extension in ['.pdf']:
                return await self._process_pdf(file_path)
            elif file_extension in ['.jpg', '.jpeg', '.png', '.tiff', '.tif']:
                return await self._process_image(file_path)
            elif file_extension in ['.txt']:
                return await self._process_text(file_path)
            else:
                logger.warning(f"Unsupported file type: {file_extension}")
                return f"Unsupported file type: {file_extension}"
        except Exception as e:
            logger.error(f"Error processing document {file_path}: {str(e)}")
            return f"Error processing document: {str(e)}"
    
    async def _process_pdf(self, file_path: str) -> str:
        """Process a PDF **safely**.

        1.  Try to extract embedded text using *pdfplumber* (pure-python, no
            C-extensions that seg-fault).
        2.  For pages that return **no** text (usually scans), render just
            that single page to a raster using *PyMuPDF* (again avoiding the
            external poppler tooling) and run Tesseract.

        This dramatically reduces the number of heavy OCR calls and – more
        importantly – avoids the crash-prone `convert_from_path` pipeline.
        """

        logger.info(f"Processing PDF: {file_path}")

        pdfplumber = _lazy_import("pdfplumber")  # type: ignore
        fitz = _lazy_import("fitz")  # PyMuPDF – type: ignore

        text_parts: List[str] = []

        # ----------------------------
        # Pass 1 – embedded text fast
        # ----------------------------
        try:
            # We do the pdfplumber extraction in a worker thread to avoid
            # blocking the event-loop.  The helper returns the list of page
            # texts (or "__NEEDS_OCR__" markers).

            def _extract_with_pdfplumber(path: str) -> List[str]:
                parts: List[str] = []
                with pdfplumber.open(path) as pdf:
                    for page in pdf.pages:
                        txt = (page.extract_text() or "").strip()
                        parts.append(txt if txt else "__NEEDS_OCR__")
                return parts

            text_parts = await asyncio.to_thread(_extract_with_pdfplumber, file_path)

        except Exception as exc:
            logger.warning("pdfplumber failed for %s – %s", file_path, exc)
            text_parts = ["__NEEDS_OCR__"] * fitz.open(file_path).page_count  # type: ignore

        # ----------------------------
        # Pass 2 – OCR where required
        # ----------------------------
        if any(part == "__NEEDS_OCR__" for part in text_parts):
            doc = fitz.open(file_path)  # type: ignore
            for page_index, txt in enumerate(text_parts):
                if txt != "__NEEDS_OCR__":
                    continue  # already have embedded text

                logger.info("OCR rasterising page %s/%s", page_index + 1, len(text_parts))

                page = doc.load_page(page_index)
                pix = page.get_pixmap(dpi=300, alpha=False)
                img_bytes = pix.pil_tobytes(format="PNG")  # returns bytes-like
                image = Image.open(io.BytesIO(img_bytes))

                ocr_text = await asyncio.to_thread(
                    pytesseract.image_to_string, image, lang="eng"
                )
                text_parts[page_index] = ocr_text

        full_text = "\n\n".join(text_parts)
        return full_text
    
    async def _process_image(self, file_path: str) -> str:
        """Process an image file with OCR."""
        logger.info(f"Processing image: {file_path}")
        
        # Open image
        image = await asyncio.to_thread(Image.open, file_path)
        
        # Extract text
        text = await asyncio.to_thread(
            pytesseract.image_to_string,
            image,
            lang='eng'
        )
        
        return text
    
    async def _process_text(self, file_path: str) -> str:
        """Process a text file."""
        logger.info(f"Processing text file: {file_path}")
        
        # Read text file
        async with open(file_path, 'r') as file:
            text = await file.read()
        
        return text
