from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from sqlalchemy.orm import joinedload
from typing import List, Optional
from datetime import date, timedelta
from app.models.machine import Machine
from app.models.shift import Shift
from app.models.expense import MaintenanceLog
from app.repositories.base import BaseRepository


class MachineRepository(BaseRepository[Machine]):
    def __init__(self, db: AsyncSession):
        super().__init__(Machine, db)

    async def get_performance(self, machine_id: int, period: str = "monthly") -> dict:
        days = {"daily": 1, "weekly": 7, "monthly": 30, "quarterly": 90, "yearly": 365}.get(period, 30)
        since = date.today() - timedelta(days=days)

        result = await self.db.execute(
            select(func.coalesce(func.sum(Shift.stitch_count), 0), func.count(Shift.id))
            .where(Shift.machine_id == machine_id, Shift.date >= since)
        )
        total_stitches, total_shifts = result.one()
        return {"period": period, "total_stitches": int(total_stitches), "total_shifts": int(total_shifts)}

    async def get_stitch_history(self, machine_id: int, days: int = 30) -> List[dict]:
        since = date.today() - timedelta(days=days)
        result = await self.db.execute(
            select(Shift.date, func.sum(Shift.stitch_count).label("stitches"))
            .where(Shift.machine_id == machine_id, Shift.date >= since)
            .group_by(Shift.date)
            .order_by(Shift.date)
        )
        return [{"date": str(row.date), "stitches": int(row.stitches)} for row in result]


class MaintenanceLogRepository(BaseRepository[MaintenanceLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(MaintenanceLog, db)

    async def get_by_machine(self, machine_id: int) -> List[MaintenanceLog]:
        result = await self.db.execute(
            select(MaintenanceLog)
            .where(MaintenanceLog.machine_id == machine_id)
            .order_by(MaintenanceLog.date.desc())
        )
        return list(result.scalars().all())
