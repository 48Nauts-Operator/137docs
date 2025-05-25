"""
Calendar export functionality for the Document Management System.
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from ics import Calendar, Event
from app.models import Document
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class CalendarService:
    """Service for calendar export functionality."""
    
    def __init__(self, db: Session):
        """Initialize the calendar service with a database session."""
        self.db = db
    
    def generate_calendar(self, document_ids: Optional[List[int]] = None) -> Calendar:
        """Generate a calendar with events for documents.
        
        Args:
            document_ids: Optional list of document IDs to include. If None, includes all documents with due dates.
            
        Returns:
            Calendar object with events
        """
        calendar = Calendar()
        
        # Query documents with due dates
        query = self.db.query(Document).filter(Document.due_date.isnot(None))
        
        # Filter by document IDs if provided
        if document_ids:
            query = query.filter(Document.id.in_(document_ids))
        
        documents = query.all()
        
        # Create events for each document
        for document in documents:
            event = Event()
            
            # Set event properties
            event.name = f"{document.document_type.capitalize()}: {document.title}"
            
            # Set description with document details
            description = f"Sender: {document.sender}\n"
            if document.amount:
                description += f"Amount: {document.amount}\n"
            description += f"Status: {document.status}\n"
            description += f"Document ID: {document.id}"
            event.description = description
            
            # Set date and time
            due_date = document.due_date
            event.begin = datetime.combine(due_date, datetime.min.time())
            event.make_all_day()
            
            # Add event to calendar
            calendar.events.add(event)
        
        logger.info(f"Generated calendar with {len(calendar.events)} events")
        return calendar
    
    def generate_ics_file(self, document_ids: Optional[List[int]] = None) -> str:
        """Generate an ICS file content for documents.
        
        Args:
            document_ids: Optional list of document IDs to include. If None, includes all documents with due dates.
            
        Returns:
            ICS file content as string
        """
        calendar = self.generate_calendar(document_ids)
        return str(calendar)
    
    def generate_upcoming_due_dates_calendar(self, days: int = 30) -> Calendar:
        """Generate a calendar with events for documents with upcoming due dates.
        
        Args:
            days: Number of days ahead to check
            
        Returns:
            Calendar object with events
        """
        calendar = Calendar()
        
        # Get current date
        today = datetime.utcnow().date()
        end_date = today + timedelta(days=days)
        
        # Query documents with upcoming due dates
        documents = self.db.query(Document).filter(
            Document.due_date >= today,
            Document.due_date <= end_date,
            Document.status != 'paid'
        ).order_by(Document.due_date).all()
        
        # Create events for each document
        for document in documents:
            event = Event()
            
            # Set event properties
            event.name = f"{document.document_type.capitalize()}: {document.title}"
            
            # Set description with document details
            description = f"Sender: {document.sender}\n"
            if document.amount:
                description += f"Amount: {document.amount}\n"
            description += f"Status: {document.status}\n"
            description += f"Document ID: {document.id}"
            event.description = description
            
            # Set date and time
            due_date = document.due_date
            event.begin = datetime.combine(due_date, datetime.min.time())
            event.make_all_day()
            
            # Add event to calendar
            calendar.events.add(event)
        
        logger.info(f"Generated upcoming due dates calendar with {len(calendar.events)} events")
        return calendar
    
    def generate_upcoming_due_dates_ics(self, days: int = 30) -> str:
        """Generate an ICS file content for documents with upcoming due dates.
        
        Args:
            days: Number of days ahead to check
            
        Returns:
            ICS file content as string
        """
        calendar = self.generate_upcoming_due_dates_calendar(days)
        return str(calendar)

class CalendarExportService(CalendarService):
    """Backward-compatibility alias – kept for code that imported CalendarExportService."""
    pass

    # ------------------ Helper async wrappers expected by FastAPI endpoints ------------------ #

    async def get_events_for_month(self, db, month: int, year: int):
        """Return list of events (documents with due_date) for given month/year (async)."""
        from datetime import date
        from sqlalchemy import select, and_
        from app.models import Document

        start = date(year, month, 1)
        if month == 12:
            end = date(year + 1, 1, 1)
        else:
            end = date(year, month + 1, 1)

        stmt = (
            select(Document)
            .where(and_(Document.due_date >= start, Document.due_date < end))
        )
        result = await db.execute(stmt)
        documents = result.scalars().all()

        return [
            {
                "id": doc.id,
                "title": doc.sender or doc.title,
                "due_date": doc.due_date if doc.due_date else None,
                "status": doc.status,
            }
            for doc in documents
        ]

    async def get_events_for_date(self, db, date_str: str):
        """Return events for a specific date (YYYY-MM-DD) – async."""
        from datetime import datetime
        from sqlalchemy import select
        from app.models import Document

        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return []

        stmt = select(Document).where(Document.due_date == target_date)
        result = await db.execute(stmt)
        documents = result.scalars().all()

        return [
            {
                "id": doc.id,
                "title": doc.title,
                "due_date": date_str,
                "status": doc.status,
            }
            for doc in documents
        ]
