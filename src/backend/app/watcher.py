"""
Document watcher module for monitoring a folder for new documents.
"""
import os
import asyncio
import logging
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileCreatedEvent, FileMovedEvent, FileModifiedEvent
from typing import Callable, Awaitable, Dict, Set
import heapq
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class ProcessingTask:
    """Represents a document processing task with priority."""
    priority: int  # Lower number = higher priority
    file_path: str
    task_type: str  # 'new', 'existing', 'modified'
    timestamp: float = field(default_factory=time.time)
    
    def __lt__(self, other):
        # For heapq - lower priority number means higher priority
        if self.priority != other.priority:
            return self.priority < other.priority
        # If same priority, newer files first
        return self.timestamp > other.timestamp

class DocumentEventHandler(FileSystemEventHandler):
    """Event handler for document file system events."""
    
    def __init__(self, callback: Callable[[str], Awaitable[None]], task_queue: asyncio.Queue):
        """Initialize with callback function and task queue."""
        self.callback = callback
        self.loop = asyncio.get_event_loop()
        self.task_queue = task_queue
    
    def _handle_event(self, path: str, task_type: str = 'new'):
        """Shared helper – schedule callback if *path* is a supported doc."""
        if self._is_document(path):
            logger.info(f"New/updated document detected via watchdog: {path}")
            # Priority 1 for new/modified files (highest priority)
            task = ProcessingTask(priority=1, file_path=path, task_type=task_type)
            asyncio.run_coroutine_threadsafe(self.task_queue.put(task), self.loop)
    
    def _is_document(self, file_path: str) -> bool:
        """Check if file is a supported document type."""
        supported_extensions = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.tiff', '.tif']
        _, ext = os.path.splitext(file_path)
        return ext.lower() in supported_extensions

    # Watchdog event hooks --------------------------------------------------

    def on_created(self, event: FileCreatedEvent):
        if not event.is_directory:
            self._handle_event(event.src_path, 'new')

    def on_moved(self, event: FileMovedEvent):
        if not event.is_directory:
            self._handle_event(event.dest_path, 'new')

    def on_modified(self, event: FileModifiedEvent):
        if not event.is_directory:
            # Some editors write directly (no rename) – treat as potential new
            self._handle_event(event.src_path, 'modified')

class FolderWatcher:
    """Watches a folder for new documents with both event-based and polling mechanisms."""
    
    def __init__(self, folder_path: str, callback: Callable[[str], Awaitable[None]], poll_interval: int = 30):
        """Initialize with folder path and callback function."""
        self.folder_path = folder_path
        self.callback = callback
        self.observer = None
        self.poll_interval = poll_interval
        self.known_files: Dict[str, float] = {}  # filename -> mtime
        self.processed_files: Set[str] = set()  # files we've already processed
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.processing_active = False
        
        # Create folder if it doesn't exist
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
    
    async def start_watching(self):
        """Start watching the folder for new documents."""
        logger.info(f"Starting to watch folder: {self.folder_path}")
        logger.info(f"Using polling interval: {self.poll_interval} seconds")
        logger.info("NEW DOCUMENTS WILL HAVE PRIORITY over existing files")
        
        # Start watchdog observer immediately
        event_handler = DocumentEventHandler(self.callback, self.task_queue)
        self.observer = Observer()
        self.observer.schedule(event_handler, self.folder_path, recursive=False)
        self.observer.start()
        logger.info("Watchdog observer started")
        
        # Start task processor (handles priority queue)
        processor_task = asyncio.create_task(self._process_task_queue())
        
        # Start polling task as fallback
        polling_task = asyncio.create_task(self._polling_loop())
        logger.info("Starting polling loop as fallback mechanism")
        
        # Process existing files in background with lower priority
        existing_files_task = asyncio.create_task(self._queue_existing_files())
        
        try:
            # Keep all mechanisms running
            await asyncio.gather(processor_task, polling_task, existing_files_task)
        except asyncio.CancelledError:
            logger.info("Stopping folder watcher...")
            processor_task.cancel()
            polling_task.cancel()
            existing_files_task.cancel()
            if self.observer:
                self.observer.stop()
                self.observer.join()
    
    async def _process_task_queue(self):
        """Process tasks from the priority queue."""
        logger.info("Starting priority task processor")
        
        while True:
            try:
                # Get next task from queue (blocks until available)
                task = await self.task_queue.get()
                
                self.processing_active = True
                logger.info(f"Processing {task.task_type} document (priority {task.priority}): {task.file_path}")
                
                try:
                    await self.callback(task.file_path)
                    logger.info(f"Successfully processed: {task.file_path}")
                except Exception as e:
                    logger.error(f"Error processing {task.file_path}: {e}")
                finally:
                    self.processing_active = False
                    self.task_queue.task_done()
                    
            except asyncio.CancelledError:
                logger.info("Task processor cancelled")
                break
            except Exception as e:
                logger.error(f"Error in task processor: {e}")
                await asyncio.sleep(1)  # Brief pause before retrying
    
    async def _polling_loop(self):
        """Polling loop to detect new files when watchdog events fail."""
        logger.info("Starting polling loop as fallback mechanism")
        
        while True:
            try:
                await asyncio.sleep(self.poll_interval)
                await self._check_for_new_files()
            except asyncio.CancelledError:
                logger.info("Polling loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in polling loop: {e}")
                await asyncio.sleep(5)  # Brief pause before retrying
    
    async def _check_for_new_files(self):
        """Check for new or modified files via polling."""
        try:
            current_files = {}
            new_files = []
            
            # Scan directory
            for filename in os.listdir(self.folder_path):
                file_path = os.path.join(self.folder_path, filename)
                
                if os.path.isfile(file_path) and self._is_document(file_path):
                    try:
                        mtime = os.path.getmtime(file_path)
                        current_files[filename] = mtime
                        
                        # Check if this is a new file or modified file
                        if filename not in self.known_files:
                            # Completely new file
                            if filename not in self.processed_files:
                                # Priority 1 for new files detected via polling
                                task = ProcessingTask(priority=1, file_path=file_path, task_type='new')
                                await self.task_queue.put(task)
                                self.processed_files.add(filename)
                                logger.info(f"New document detected via polling: {file_path}")
                        elif mtime > self.known_files[filename]:
                            # Modified file - treat as new for processing
                            if filename not in self.processed_files:
                                # Priority 2 for modified files
                                task = ProcessingTask(priority=2, file_path=file_path, task_type='modified')
                                await self.task_queue.put(task)
                                self.processed_files.add(filename)
                                logger.info(f"Modified document detected via polling: {file_path}")
                    except OSError as e:
                        logger.warning(f"Could not get mtime for {file_path}: {e}")
            
            # Update known files
            self.known_files = current_files
                    
        except Exception as e:
            logger.error(f"Error checking for new files: {e}")
    
    async def _queue_existing_files(self):
        """Queue existing files for processing with lower priority."""
        logger.info("Queuing existing files with lower priority...")
        
        for filename in os.listdir(self.folder_path):
            file_path = os.path.join(self.folder_path, filename)
            if os.path.isfile(file_path) and self._is_document(file_path):
                try:
                    # Record file in known files
                    mtime = os.path.getmtime(file_path)
                    self.known_files[filename] = mtime
                    self.processed_files.add(filename)
                    
                    # Priority 10 for existing files (lowest priority)
                    task = ProcessingTask(priority=10, file_path=file_path, task_type='existing')
                    await self.task_queue.put(task)
                    logger.info(f"Queued existing document: {file_path}")
                    
                    # Small delay to allow new files to be processed first
                    await asyncio.sleep(0.1)
                    
                except Exception as e:
                    logger.error(f"Error queuing existing file {file_path}: {e}")
        
        logger.info("Finished queuing existing files")
    
    def _is_document(self, file_path: str) -> bool:
        """Check if file is a supported document type."""
        supported_extensions = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.tiff', '.tif']
        _, ext = os.path.splitext(file_path)
        return ext.lower() in supported_extensions
