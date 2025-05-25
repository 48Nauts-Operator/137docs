"""
Document watcher module for monitoring the inbox folder.
"""
import os
import time
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from pathlib import Path
from typing import Callable, List, Set
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class DocumentEventHandler(FileSystemEventHandler):
    """Handler for file system events in the inbox folder."""
    
    def __init__(self, callback: Callable[[str], None], allowed_extensions: List[str]):
        """Initialize the event handler.
        
        Args:
            callback: Function to call when a new file is detected
            allowed_extensions: List of allowed file extensions
        """
        self.callback = callback
        self.allowed_extensions = allowed_extensions
        self.processing_files: Set[str] = set()
        super().__init__()
    
    def on_created(self, event):
        """Handle file creation events."""
        if event.is_directory:
            return
        
        file_path = event.src_path
        if self._is_valid_file(file_path) and file_path not in self.processing_files:
            logger.info(f"New file detected: {file_path}")
            self.processing_files.add(file_path)
            
            # Wait a moment to ensure the file is fully written
            time.sleep(1)
            
            # Call the callback function with the file path
            try:
                self.callback(file_path)
            except Exception as e:
                logger.error(f"Error processing file {file_path}: {e}")
            finally:
                self.processing_files.remove(file_path)
    
    def _is_valid_file(self, file_path: str) -> bool:
        """Check if the file has an allowed extension."""
        ext = Path(file_path).suffix.lower().lstrip(".")
        return ext in self.allowed_extensions


class DocumentWatcher:
    """Watches the inbox folder for new documents."""
    
    def __init__(self, callback: Callable[[str], None]):
        """Initialize the document watcher.
        
        Args:
            callback: Function to call when a new file is detected
        """
        self.inbox_folder = settings.INBOX_FOLDER
        self.allowed_extensions = settings.ALLOWED_FILE_TYPES
        self.callback = callback
        self.observer = None
        
        # Ensure inbox folder exists
        os.makedirs(self.inbox_folder, exist_ok=True)
        
        logger.info(f"Initializing document watcher for folder: {self.inbox_folder}")
        logger.info(f"Allowed file types: {', '.join(self.allowed_extensions)}")
    
    def start(self):
        """Start watching the inbox folder."""
        event_handler = DocumentEventHandler(self.callback, self.allowed_extensions)
        self.observer = Observer()
        self.observer.schedule(event_handler, self.inbox_folder, recursive=False)
        self.observer.start()
        logger.info(f"Started watching folder: {self.inbox_folder}")
        
        # Process any existing files in the inbox
        self._process_existing_files()
    
    def stop(self):
        """Stop watching the inbox folder."""
        if self.observer:
            self.observer.stop()
            self.observer.join()
            logger.info("Stopped watching folder")
    
    def _process_existing_files(self):
        """Process any existing files in the inbox folder."""
        for filename in os.listdir(self.inbox_folder):
            file_path = os.path.join(self.inbox_folder, filename)
            if os.path.isfile(file_path) and self._is_valid_file(file_path):
                logger.info(f"Processing existing file: {file_path}")
                try:
                    self.callback(file_path)
                except Exception as e:
                    logger.error(f"Error processing existing file {file_path}: {e}")
    
    def _is_valid_file(self, file_path: str) -> bool:
        """Check if the file has an allowed extension."""
        ext = Path(file_path).suffix.lower().lstrip(".")
        return ext in self.allowed_extensions
