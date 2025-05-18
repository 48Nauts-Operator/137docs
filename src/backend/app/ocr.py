"""
OCR and document processing module for the Document Management System.
"""
import os
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import logging
import asyncio
from typing import List, Optional

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
        """Process a PDF file with OCR."""
        logger.info(f"Processing PDF: {file_path}")
        
        # Convert PDF to images
        images = await asyncio.to_thread(
            convert_from_path, 
            file_path, 
            dpi=300
        )
        
        # Process each page
        text_parts = []
        for i, image in enumerate(images):
            logger.info(f"Processing page {i+1}/{len(images)}")
            page_text = await asyncio.to_thread(
                pytesseract.image_to_string,
                image,
                lang='eng'
            )
            text_parts.append(page_text)
        
        # Combine all pages
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
