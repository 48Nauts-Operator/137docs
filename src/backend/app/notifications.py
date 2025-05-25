"""app.notifications
=====================
Modular *async* notification framework for 137docs.

Key design goals:
• Backend-only **channels** (in-app DB, e-mail, Slack, SMS, …) implement the
  :class:`NotificationChannel` interface and can be registered at runtime.
• NotificationService stays thin – it orchestrates *persistence* (always
  recorded in the database) and dispatches the event to all configured
  channels.
• Pure-SQLAlchemy **async** code; no blocking ``db.query`` calls.
• Works out-of-the-box with a single *InAppChannel* so existing API routes
  keep functioning.  New channels can be plugged in without changing the core
  logic – ideal for future e-mail/push/SSE upgrades.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import List, Optional, Sequence

from sqlalchemy import select, update, func, text, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Notification, Document

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Channel abstraction
# ---------------------------------------------------------------------------


class NotificationChannel(ABC):
    """Abstract *async* notification channel."""

    @abstractmethod
    async def send(self, notification: Notification, db: AsyncSession) -> None:  # noqa: D401,E501 – keep concise signature
        """Deliver *notification* via this channel.

        A DB session is supplied in case the channel needs extra queries
        (e.g. to resolve user e-mail addresses).
        """


class InAppChannel(NotificationChannel):
    """Default channel – no external delivery, only stored in DB."""

    async def send(self, notification: Notification, db: AsyncSession) -> None:  # noqa: D401,E501 – method required by interface
        # Already persisted; nothing else to do.
        return


# ---------------------------------------------------------------------------
# Serialisation helpers
# ---------------------------------------------------------------------------


def _notification_to_dict(notif: Notification) -> dict[str, object]:
    """Return plain-JSON version of *notif* suitable for FastAPI responses."""

    if notif is None:
        return {}

    return {
        "id": notif.id,
        "title": notif.title,
        "message": notif.message,
        "type": notif.type,
        "document_id": notif.document_id,
        "is_read": notif.is_read,
        "created_at": notif.created_at.isoformat() if notif.created_at else None,
    }


# ---------------------------------------------------------------------------
# Notification service
# ---------------------------------------------------------------------------


class NotificationService:
    """Stateless helper providing high-level notification APIs."""

    def __init__(self, channels: Optional[Sequence[NotificationChannel]] = None):
        # Always include in-app DB channel so notifications are recorded.
        self.channels: List[NotificationChannel] = list(channels) if channels else []
        # Ensure InAppChannel is present exactly once at the *front* of list.
        self.channels.insert(0, InAppChannel())

    # ---------------- CRUD helpers ----------------

    async def create_notification(
        self,
        db: AsyncSession,
        title: str,
        message: str,
        notification_type: str,
        document_id: Optional[int] = None,
    ) -> dict:
        """Persist notification record and dispatch to channels."""

        notification = Notification(
            title=title,
            message=message,
            type=notification_type,
            document_id=document_id,
        )

        db.add(notification)
        await db.flush()
        # Ensure PK assigned for downstream consumers
        await db.refresh(notification)

        # Fan-out to channels (ignore failures – log only)
        for ch in self.channels:
            try:
                await ch.send(notification, db)
            except Exception as exc:  # pragma: no-cover – diagnostics only
                logger.warning("Notification channel %s failed: %s", ch.__class__.__name__, exc)

        return _notification_to_dict(notification)

    async def get_all_notifications(
        self,
        db: AsyncSession,
        limit: int = 100,
        offset: int = 0,
        include_read: bool = False,
    ) -> List[dict]:
        q = select(Notification)
        if not include_read:
            q = q.filter(Notification.is_read.is_(False))
        q = q.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        res = await db.execute(q)
        notifs = res.scalars().all()
        return [_notification_to_dict(n) for n in notifs]

    async def mark_as_read(self, db: AsyncSession, notification_id: int) -> Optional[dict]:
        q = (
            update(Notification)
            .where(Notification.id == notification_id)
            .values(is_read=True)
            .returning(Notification)
        )
        res = await db.execute(q)
        await db.flush()
        notif = res.fetchone()
        return _notification_to_dict(notif[0]) if notif else None

    async def mark_all_as_read(self, db: AsyncSession) -> int:
        q = (
            update(Notification)
            .where(Notification.is_read.is_(False))
            .values(is_read=True)
        )
        res = await db.execute(q)
        await db.flush()
        return res.rowcount or 0

    # ---------------- Business-logic helpers ----------------

    async def check_overdue_documents(self, db: AsyncSession) -> List[Notification]:
        today = datetime.utcnow().date()

        stmt = select(Document).filter(Document.status != "paid", Document.due_date != "")
        overdue_docs = (await db.execute(stmt)).scalars().all()

        notifications: List[Notification] = []
        for doc in overdue_docs:
            exists_stmt = select(Notification.id).filter(
                Notification.document_id == doc.id,
                Notification.type == "overdue",
                Notification.is_read.is_(False),
            )
            if (await db.execute(exists_stmt)).first():
                continue  # already notified

            try:
                doc_due = datetime.fromisoformat(str(doc.due_date)).date()  # type: ignore
            except Exception:
                continue

            if doc_due >= today:
                continue

            days_overdue = (today - doc_due).days
            notif = await self.create_notification(
                db,
                title=f"Overdue: {doc.title}",
                message=f"Document '{doc.title}' is {days_overdue} days overdue (due {doc.due_date}).",
                notification_type="overdue",
                document_id=doc.id,
            )
            notifications.append(notif)
        return notifications

    async def check_upcoming_due_dates(
        self, db: AsyncSession, days_ahead: int = 7
    ) -> List[Notification]:
        today = datetime.utcnow().date()
        upcoming_limit = today + timedelta(days=days_ahead)

        stmt = select(Document).filter(Document.status != "paid", Document.due_date != "")
        docs = (await db.execute(stmt)).scalars().all()

        notifications: List[Notification] = []
        for doc in docs:
            exists_stmt = select(Notification.id).filter(
                Notification.document_id == doc.id,
                Notification.type == "reminder",
                Notification.is_read.is_(False),
            )
            if (await db.execute(exists_stmt)).first():
                continue

            try:
                doc_due = datetime.fromisoformat(str(doc.due_date)).date()  # type: ignore
            except Exception:
                continue

            if not (today <= doc_due <= upcoming_limit):
                continue

            days_until = (doc_due - today).days
            notif = await self.create_notification(
                db,
                title=f"Upcoming: {doc.title}",
                message=f"Document '{doc.title}' is due in {days_until} days ({doc.due_date}).",
                notification_type="reminder",
                document_id=doc.id,
            )
            notifications.append(notif)
        return notifications

    async def create_due_date_notification(self, db: AsyncSession, document: Document):
        if not document.due_date:
            return None
        return await self.create_notification(
            db,
            title=f"Due: {document.title}",
            message=f"Document '{document.title}' is due on {document.due_date}.",
            notification_type="reminder",
            document_id=document.id,
        )
