"""app.scheduler
================
Background task that periodically scans invoices and creates *reminder*
notifications three days before the due-date.

We skip heavyweight dependencies (Celery, APScheduler) and instead launch a
lightweight asyncio task from `main.startup()` that sleeps until the next run.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from app.database import async_session
from app.notifications import NotificationService

logger = logging.getLogger(__name__)

# How many days before due-date a reminder should fire
DAYS_BEFORE_DUE = 3
# At which UTC hour the daily scan runs (02:00 by default)
SCAN_HOUR_UTC = 2

# Dedicated service instance for scheduler (avoids import cycle with app.main)
_service = NotificationService()


async def _run_once() -> None:
    """Execute one scan cycle and create missing reminder notifications."""
    async with async_session() as db:
        created = await _service.check_upcoming_due_dates(
            db, days_ahead=DAYS_BEFORE_DUE
        )
        await db.commit()
        if created:
            logger.info("Scheduler: created %d upcoming-due notifications", len(created))
        else:
            logger.debug("Scheduler: no upcoming invoices in next %d days", DAYS_BEFORE_DUE)


async def scheduler_loop() -> None:
    """Background coroutine that runs forever with a 24-h cadence."""

    # Perform an immediate run on startup so the system is up-to-date even if
    # the container starts after the scheduled time.
    await _run_once()

    while True:
        # Calculate seconds until the next SCAN_HOUR_UTC.
        now = datetime.now(tz=timezone.utc)
        next_run = now.replace(hour=SCAN_HOUR_UTC, minute=0, second=0, microsecond=0)
        if next_run <= now:
            next_run = next_run + timedelta(days=1)
        sleep_seconds = (next_run - now).total_seconds()
        logger.debug("Scheduler sleeping for %.0f seconds (until %s)", sleep_seconds, next_run)
        await asyncio.sleep(sleep_seconds)
        try:
            await _run_once()
        except Exception as exc:  # pragma: no-cover – monitor only
            logger.exception("Scheduler run failed: %s", exc)


def start_scheduler() -> None:
    """Spawn the background task; safe to call multiple times."""
    loop = asyncio.get_event_loop()
    # Avoid multiple tasks in hot-reload scenarios
    for t in asyncio.all_tasks(loop):
        if t.get_coro().__name__ == "scheduler_loop":
            return
    loop.create_task(scheduler_loop(), name="scheduler_loop") 