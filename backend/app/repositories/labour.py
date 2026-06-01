from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from typing import List, Optional
from app.models.labour import Labour
from app.models.advance import Advance
from app.repositories.base import BaseRepository


class LabourRepository(BaseRepository[Labour]):
    def __init__(self, db: AsyncSession):
        super().__init__(Labour, db)


class AdvanceRepository(BaseRepository[Advance]):
    def __init__(self, db: AsyncSession):
        super().__init__(Advance, db)

    async def get_monthly_total(self, labour_id: int, month: int, year: int) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(Advance.amount), 0))
            .where(
                Advance.labour_id == labour_id,
                extract("month", Advance.date) == month,
                extract("year", Advance.date) == year,
            )
        )
        return float(result.scalar())

    async def get_monthly_advances(self, labour_id: int, month: int, year: int) -> List[Advance]:
        result = await self.db.execute(
            select(Advance)
            .where(
                Advance.labour_id == labour_id,
                extract("month", Advance.date) == month,
                extract("year", Advance.date) == year,
            )
            .order_by(Advance.date.desc())
        )
        return list(result.scalars().all())

    async def get_by_labour(self, labour_id: int) -> List[Advance]:
        result = await self.db.execute(
            select(Advance).where(Advance.labour_id == labour_id).order_by(Advance.date.desc())
        )
        return list(result.scalars().all())
