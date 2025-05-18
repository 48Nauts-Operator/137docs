"""
Document watcher module for monitoring a folder for new documents.
"""
import os
import asyncio
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from typing import Callable, Awaitable

logger = logging.getLogger(__name__)

class DocumentEventHandler(FileSystemEventHandler):
    """Event handler for document file system events."""
    
    def __init__(self, callback: Callable[[str], Awaitable[None]]):
        """Initialize with callback function."""
        self.callback = callback
        self.loop = asyncio.get_event_loop()
    
    def on_created(self, event):
        """Handle file creation events."""
        if not event.is_directory:
            file_path = event.src_path
            # Check if file is a document (PDF, DOCX, etc.)
            if self._is_document(file_path):
                logger.info(f"New document detected: {file_path}")
                # Schedule callback in event loop
                asyncio.run_coroutine_threadsafe(self.callback(file_path), self.loop)
    
    def _is_document(self, file_path: str) -> bool:
        """Check if file is a supported document type."""
        supported_extensions = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.tiff', '.tif']
        _, ext = os.path.splitext(file_path)
        return ext.lower() in supported_extensions

class FolderWatcher:
    """Watches a folder for new documents."""
    
    def __init__(self, folder_path: str, callback: Callable[[str], Awaitable[None]]):
        """Initialize with folder path and callback function."""
        self.folder_path = folder_path
        self.callback = callback
        self.observer = None
        
        # Create folder if it doesn't exist
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
    
    async def start_watching(self):
        """Start watching the folder for new documents."""
        logger.info(f"Starting to watch folder: {self.folder_path}")
        
        # Process existing files
        await self._process_existing_files()
        
        # Start observer
        event_handler = DocumentEventHandler(self.callback)
        self.observer = Observer()
        self.observer.schedule(event_handler, self.folder_path, recursive=False)
        self.observer.start()
        
        try:
            # Keep the observer running
            while True:
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            self.observer.stop()
            self.observer.join()
    
    async def _process_existing_files(self):
        """Process existing files in the folder."""
        for filename in os.listdir(self.folder_path):
            file_path = os.path.join(self.folder_path, filename)
            if os.path.isfile(file_path) and self._is_document(file_path):
                logger.info(f"Processing existing document: {file_path}")
                await self.callback(file_path)
    
    def _is_document(self, file_path: str) -> bool:
        """Check if file is a supported document type."""
        supported_extensions = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.tiff', '.tif']
        _, ext = os.path.splitext(file_path)
        return ext.lower() in supported_extensions
