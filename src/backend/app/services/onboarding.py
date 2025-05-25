from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models import AppSettings

class OnboardingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def accept_tos(self):
        settings = await self._settings_row()
        settings.tos_accepted_at = datetime.utcnow()
        await self.db.commit()
        return settings.tos_accepted_at

    async def tos_accepted(self) -> bool:
        settings = await self._settings_row()
        return settings.tos_accepted_at is not None

    async def _settings_row(self):
        row = await self.db.get(AppSettings, 1)
        if not row:
            row = AppSettings(inbox_path="/tmp", storage_root="/tmp")
            self.db.add(row)
            await self.db.commit()
            await self.db.refresh(row)
        return row 