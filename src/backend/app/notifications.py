"""
Notification models and functionality for the Document Management System.
"""
import logging
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.models import Base, Notification, Document
from app.database import get_db
from typing import List, Optional, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class NotificationService:
    """Service for managing notifications – stateless helper with async DB operations."""
    
    async def create_notification(self, db, title: str, message: str, notification_type: str, document_id: Optional[int] = None) -> Notification:
        """Create a new notification.
        
        Args:
            title: Notification title
            message: Notification message
            notification_type: Type of notification (e.g., "overdue", "reminder", "system")
            document_id: Optional document ID associated with the notification
            
        Returns:
            Created notification instance
        """
        notification = Notification(
            title=title,
            message=message,
            notification_type=notification_type,
            document_id=document_id
        )
        
        db.add(notification)
        await db.flush()
        await db.refresh(notification)
        
        logger.info(f"Created notification: {notification.id} - {notification.title}")
        return notification
    
    async def get_all_notifications(self, db, limit: int = 100, offset: int = 0, include_read: bool = False) -> List[Notification]:
        """Get notifications with optional filtering.
        
        Args:
            limit: Maximum number of notifications to return
            offset: Number of notifications to skip
            include_read: Whether to include read notifications
            
        Returns:
            List of notification instances
        """
        query = db.query(Notification)
        
        # Filter out read notifications if not included
        if not include_read:
            query = query.filter(Notification.is_read == False)
        
        # Apply pagination
        query = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        
        return query.all()
    
    async def mark_as_read(self, db, notification_id: int) -> Optional[Notification]:
        """Mark a notification as read.
        
        Args:
            notification_id: Notification ID
            
        Returns:
            Updated notification instance or None if not found
        """
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            return None
        
        notification.is_read = True
        await db.flush()
        
        logger.info(f"Marked notification as read: {notification.id}")
        return notification
    
    async def mark_all_as_read(self, db) -> int:
        """Mark all notifications as read.
        
        Returns:
            Number of notifications marked as read
        """
        result = db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
        await db.flush()
        
        logger.info(f"Marked {result} notifications as read")
        return result
    
    async def check_overdue_documents(self, db) -> List[Notification]:
        """Check for overdue documents and create notifications.
        
        Returns:
            List of created notifications
        """
        today = datetime.utcnow().date()
        
        # Find documents with due dates in the past that are not marked as paid
        overdue_documents = db.query(Document).filter(
            Document.due_date < today,
            Document.status != "paid"
        ).all()
        
        notifications = []
        for document in overdue_documents:
            # Check if notification already exists for this document
            existing_notification = db.query(Notification).filter(
                Notification.document_id == document.id,
                Notification.notification_type == "overdue",
                Notification.is_read == False
            ).first()
            
            if not existing_notification:
                # Create new notification
                days_overdue = (today - document.due_date).days
                notification = await self.create_notification(
                    db,
                    title=f"Overdue: {document.title}",
                    message=f"Document '{document.title}' is {days_overdue} days overdue. Due date was {document.due_date}.",
                    notification_type="overdue",
                    document_id=document.id
                )
                notifications.append(notification)
        
        return notifications
    
    async def check_upcoming_due_dates(self, db, days_ahead: int = 7) -> List[Notification]:
        """Check for documents with upcoming due dates and create reminders.
        
        Args:
            days_ahead: Number of days ahead to check
            
        Returns:
            List of created notifications
        """
        today = datetime.utcnow().date()
        upcoming_date = today + timedelta(days=days_ahead)
        
        # Find documents with due dates in the upcoming period that are not marked as paid
        upcoming_documents = db.query(Document).filter(
            Document.due_date >= today,
            Document.due_date <= upcoming_date,
            Document.status != "paid"
        ).all()
        
        notifications = []
        for document in upcoming_documents:
            # Check if notification already exists for this document
            existing_notification = db.query(Notification).filter(
                Notification.document_id == document.id,
                Notification.notification_type == "reminder",
                Notification.is_read == False
            ).first()
            
            if not existing_notification:
                # Create new notification
                days_until_due = (document.due_date - today).days
                notification = await self.create_notification(
                    db,
                    title=f"Upcoming: {document.title}",
                    message=f"Document '{document.title}' is due in {days_until_due} days on {document.due_date}.",
                    notification_type="reminder",
                    document_id=document.id
                )
                notifications.append(notification)
        
        return notifications

    async def create_due_date_notification(self, db, document):
        """Helper used by watcher to create reminder for a document with a due date."""
        if not document.due_date:
            return None
        return await self.create_notification(
            db,
            title=f"Due: {document.title}",
            message=f"Document '{document.title}' is due on {document.due_date}.",
            notification_type="reminder",
            document_id=document.id,
        )
