"""
OCR and document processing module.
"""
import os
import logging
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import pdfplumber
import fitz  # PyMuPDF
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import re
import shutil
from datetime import datetime
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class OCRProcessor:
    """Handles OCR processing and metadata extraction from documents."""
    
    def __init__(self):
        """Initialize the OCR processor."""
        # Set Tesseract command if specified in settings
        if settings.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
        
        # Ensure archive folder exists
        os.makedirs(settings.ARCHIVE_FOLDER, exist_ok=True)
        
        logger.info("Initialized OCR processor")
    
    def process_document(self, file_path: str) -> Dict[str, Any]:
        """Process a document file and extract text and metadata.
        
        Args:
            file_path: Path to the document file
            
        Returns:
            Dict containing extracted text and metadata
        """
        logger.info(f"Processing document: {file_path}")
        
        file_ext = Path(file_path).suffix.lower()
        
        # Extract text based on file type
        if file_ext == ".pdf":
            text, images = self._process_pdf(file_path)
        elif file_ext in [".jpg", ".jpeg", ".png"]:
            text = self._process_image(file_path)
            images = [file_path]
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
        
        # Extract metadata from text
        metadata = self._extract_metadata(text)
        
        # Move file to archive
        archive_path = self._archive_file(file_path)
        
        # Combine results
        result = {
            "original_path": file_path,
            "archive_path": archive_path,
            "filename": os.path.basename(file_path),
            "content_text": text,
            **metadata
        }
        
        logger.info(f"Document processed: {result['filename']}")
        return result
    
    def _process_pdf(self, file_path: str) -> Tuple[str, List[str]]:
        """Extract text from a PDF file using multiple methods for best results.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Tuple of (extracted text, list of image paths)
        """
        logger.info(f"Processing PDF: {file_path}")
        
        # Method 1: Extract text using PyMuPDF (faster but may miss some text)
        text_mupdf = self._extract_text_pymupdf(file_path)
        
        # Method 2: Extract text using pdfplumber (slower but more accurate for some PDFs)
        text_plumber = self._extract_text_pdfplumber(file_path)
        
        # Method 3: Convert PDF to images and use OCR (for scanned documents)
        images = []
        text_ocr = ""
        
        # If text extraction methods didn't yield much text, try OCR
        if len(text_mupdf) < 100 and len(text_plumber) < 100:
            logger.info(f"PDF appears to be scanned, using OCR: {file_path}")
            text_ocr, images = self._extract_text_ocr_pdf(file_path)
        
        # Use the best result (longest text)
        texts = [text_mupdf, text_plumber, text_ocr]
        best_text = max(texts, key=len)
        
        return best_text, images
    
    def _extract_text_pymupdf(self, file_path: str) -> str:
        """Extract text from PDF using PyMuPDF."""
        try:
            text = ""
            with fitz.open(file_path) as doc:
                for page in doc:
                    text += page.get_text()
            return text
        except Exception as e:
            logger.error(f"Error extracting text with PyMuPDF: {e}")
            return ""
    
    def _extract_text_pdfplumber(self, file_path: str) -> str:
        """Extract text from PDF using pdfplumber."""
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
            return text
        except Exception as e:
            logger.error(f"Error extracting text with pdfplumber: {e}")
            return ""
    
    def _extract_text_ocr_pdf(self, file_path: str) -> Tuple[str, List[str]]:
        """Extract text from PDF using OCR."""
        try:
            # Convert PDF to images
            images = convert_from_path(file_path)
            
            # Create temporary directory for images
            temp_dir = os.path.join(os.path.dirname(file_path), "temp_ocr")
            os.makedirs(temp_dir, exist_ok=True)
            
            # Save images and perform OCR
            image_paths = []
            text = ""
            
            for i, image in enumerate(images):
                image_path = os.path.join(temp_dir, f"page_{i+1}.png")
                image.save(image_path, "PNG")
                image_paths.append(image_path)
                
                # Perform OCR on the image
                text += pytesseract.image_to_string(image) + "\n\n"
            
            return text, image_paths
        except Exception as e:
            logger.error(f"Error performing OCR on PDF: {e}")
            return "", []
    
    def _process_image(self, file_path: str) -> str:
        """Extract text from an image file using OCR.
        
        Args:
            file_path: Path to the image file
            
        Returns:
            Extracted text
        """
        logger.info(f"Processing image with OCR: {file_path}")
        
        try:
            # Open the image
            image = Image.open(file_path)
            
            # Perform OCR
            text = pytesseract.image_to_string(image)
            
            return text
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return ""
    
    def _extract_metadata(self, text: str) -> Dict[str, Any]:
        """Extract metadata from document text.
        
        Args:
            text: Extracted document text
            
        Returns:
            Dict containing extracted metadata
        """
        # Initialize metadata with default values
        metadata = {
            "title": "",
            "sender": "",
            "document_date": None,
            "due_date": None,
            "amount": None,
            "document_type": "unknown"
        }
        
        # Extract title (use first non-empty line or filename)
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if lines:
            metadata["title"] = lines[0][:100]  # Limit title length
        
        # Extract sender (look for common patterns like "From:", "Sender:", company names)
        sender_patterns = [
            r"(?:From|Sender|Company):\s*([^\n]+)",
            r"(?:[A-Z][a-z]+ [A-Z][a-z]+|[A-Z][A-Z\s]+)\s*(?:Inc\.|LLC|Ltd\.|GmbH|B\.V\.)",
        ]
        
        for pattern in sender_patterns:
            matches = re.search(pattern, text)
            if matches:
                metadata["sender"] = matches.group(1).strip()
                break
        
        # Extract dates
        date_patterns = [
            r"(?:Date|Datum):\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})",
            r"(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})",
            r"(\d{4}[./\-]\d{1,2}[./\-]\d{1,2})"
        ]
        
        dates = []
        for pattern in date_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                dates.append(match.group(1))
        
        # Assign document date (first date found)
        if dates:
            metadata["document_date"] = dates[0]
        
        # Extract due date (look for patterns like "Due date:", "Payment due:")
        due_date_patterns = [
            r"(?:Due Date|Payment Due|Pay By|Fälligkeitsdatum):\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})",
            r"(?:due|payment).{1,20}(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})"
        ]
        
        for pattern in due_date_patterns:
            matches = re.search(pattern, text, re.IGNORECASE)
            if matches:
                metadata["due_date"] = matches.group(1)
                break
        
        # Extract amount (look for currency symbols and numbers)
        amount_patterns = [
            r"(?:Total|Amount|Sum|Betrag):\s*[$€£¥]\s*(\d+[.,]\d+)",
            r"(?:Total|Amount|Sum|Betrag):\s*(\d+[.,]\d+)\s*[$€£¥]",
            r"[$€£¥]\s*(\d+[.,]\d+)",
            r"(\d+[.,]\d+)\s*[$€£¥]"
        ]
        
        for pattern in amount_patterns:
            matches = re.search(pattern, text)
            if matches:
                # Convert to float, handling different decimal separators
                amount_str = matches.group(1).replace(",", ".")
                try:
                    metadata["amount"] = float(amount_str)
                except ValueError:
                    pass
                break
        
        # Determine document type
        metadata["document_type"] = self._classify_document_type(text)
        
        return metadata
    
    def _classify_document_type(self, text: str) -> str:
        """Classify document type based on content.
        
        Args:
            text: Document text
            
        Returns:
            Document type classification
        """
        text_lower = text.lower()
        
        # Check for invoice indicators
        if any(keyword in text_lower for keyword in ["invoice", "rechnung", "facture", "bill", "payment due"]):
            return "invoice"
        
        # Check for receipt indicators
        if any(keyword in text_lower for keyword in ["receipt", "quittung", "reçu", "paid", "payment received"]):
            return "receipt"
        
        # Check for reminder indicators
        if any(keyword in text_lower for keyword in ["reminder", "mahnung", "rappel", "overdue", "second notice"]):
            return "reminder"
        
        # Check for contract indicators
        if any(keyword in text_lower for keyword in ["contract", "vertrag", "contrat", "agreement", "terms"]):
            return "contract"
        
        # Default to "document" if no specific type is identified
        return "document"
    
    def _archive_file(self, file_path: str) -> str:
        """Move the processed file to the archive folder.
        
        Args:
            file_path: Path to the original file
            
        Returns:
            Path to the archived file
        """
        # Create date-based folder structure
        today = datetime.now()
        year_month = today.strftime("%Y-%m")
        archive_subdir = os.path.join(settings.ARCHIVE_FOLDER, year_month)
        os.makedirs(archive_subdir, exist_ok=True)
        
        # Generate archive filename
        filename = os.path.basename(file_path)
        timestamp = today.strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(filename)
        archive_filename = f"{name}_{timestamp}{ext}"
        archive_path = os.path.join(archive_subdir, archive_filename)
        
        # Move file to archive
        shutil.copy2(file_path, archive_path)
        os.remove(file_path)
        
        logger.info(f"Archived file: {file_path} -> {archive_path}")
        return archive_path
