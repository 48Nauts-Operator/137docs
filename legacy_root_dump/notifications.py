"""
Notification models and functionality for the Document Management System.
"""
import logging
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.models import Base
from app.database import get_db
from typing import List, Optional, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class Notification(Base):
    """Notification model for storing system notifications."""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    title = Column(String, index=True)
    message = Column(Text)
    notification_type = Column(String, index=True)  # e.g., "overdue", "reminder", "system"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="notifications")


# Add relationship to Document model
from app.models import Document
Document.notifications = relationship("Notification", back_populates="document")


class NotificationService:
    """Service for managing notifications."""
    
    def __init__(self, db):
        """Initialize the notification service with a database session."""
        self.db = db
    
    def create_notification(self, title: str, message: str, notification_type: str, document_id: Optional[int] = None) -> Notification:
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
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        logger.info(f"Created notification: {notification.id} - {notification.title}")
        return notification
    
    def get_notifications(self, limit: int = 100, offset: int = 0, include_read: bool = False) -> List[Notification]:
        """Get notifications with optional filtering.
        
        Args:
            limit: Maximum number of notifications to return
            offset: Number of notifications to skip
            include_read: Whether to include read notifications
            
        Returns:
            List of notification instances
        """
        query = self.db.query(Notification)
        
        # Filter out read notifications if not included
        if not include_read:
            query = query.filter(Notification.is_read == False)
        
        # Apply pagination
        query = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        
        return query.all()
    
    def mark_as_read(self, notification_id: int) -> Optional[Notification]:
        """Mark a notification as read.
        
        Args:
            notification_id: Notification ID
            
        Returns:
            Updated notification instance or None if not found
        """
        notification = self.db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            return None
        
        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        
        logger.info(f"Marked notification as read: {notification.id}")
        return notification
    
    def mark_all_as_read(self) -> int:
        """Mark all notifications as read.
        
        Returns:
            Number of notifications marked as read
        """
        result = self.db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
        self.db.commit()
        
        logger.info(f"Marked {result} notifications as read")
        return result
    
    def check_overdue_documents(self) -> List[Notification]:
        """Check for overdue documents and create notifications.
        
        Returns:
            List of created notifications
        """
        today = datetime.utcnow().date()
        
        # Find documents with due dates in the past that are not marked as paid
        overdue_documents = self.db.query(Document).filter(
            Document.due_date < today,
            Document.status != "paid"
        ).all()
        
        notifications = []
        for document in overdue_documents:
            # Check if notification already exists for this document
            existing_notification = self.db.query(Notification).filter(
                Notification.document_id == document.id,
                Notification.notification_type == "overdue",
                Notification.is_read == False
            ).first()
            
            if not existing_notification:
                # Create new notification
                days_overdue = (today - document.due_date).days
                notification = self.create_notification(
                    title=f"Overdue: {document.title}",
                    message=f"Document '{document.title}' is {days_overdue} days overdue. Due date was {document.due_date}.",
                    notification_type="overdue",
                    document_id=document.id
                )
                notifications.append(notification)
        
        return notifications
    
    def check_upcoming_due_dates(self, days_ahead: int = 7) -> List[Notification]:
        """Check for documents with upcoming due dates and create reminders.
        
        Args:
            days_ahead: Number of days ahead to check
            
        Returns:
            List of created notifications
        """
        today = datetime.utcnow().date()
        upcoming_date = today + timedelta(days=days_ahead)
        
        # Find documents with due dates in the upcoming period that are not marked as paid
        upcoming_documents = self.db.query(Document).filter(
            Document.due_date >= today,
            Document.due_date <= upcoming_date,
            Document.status != "paid"
        ).all()
        
        notifications = []
        for document in upcoming_documents:
            # Check if notification already exists for this document
            existing_notification = self.db.query(Notification).filter(
                Notification.document_id == document.id,
                Notification.notification_type == "reminder",
                Notification.is_read == False
            ).first()
            
            if not existing_notification:
                # Create new notification
                days_until_due = (document.due_date - today).days
                notification = self.create_notification(
                    title=f"Upcoming: {document.title}",
                    message=f"Document '{document.title}' is due in {days_until_due} days on {document.due_date}.",
                    notification_type="reminder",
                    document_id=document.id
                )
                notifications.append(notification)
        
        return notifications
