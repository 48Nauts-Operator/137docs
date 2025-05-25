from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Entity

class EntityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self) -> List[Entity]:
        res = await self.db.execute(select(Entity))
        return res.scalars().all()

    async def create(self, **kwargs) -> Entity:
        ent = Entity(**kwargs)
        self.db.add(ent)
        await self.db.commit()
        await self.db.refresh(ent)
        return ent

    async def update(self, entity_id: int, **kwargs) -> Optional[Entity]:
        ent = await self.db.get(Entity, entity_id)
        if not ent:
            return None
        for k,v in kwargs.items():
            setattr(ent, k, v)
        await self.db.commit()
        await self.db.refresh(ent)
        return ent 