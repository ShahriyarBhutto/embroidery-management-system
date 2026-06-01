from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from typing import List, Optional
from datetime import date
from app.models.expense import DailyExpense, MaintenanceLog
from app.models.machine import Machine
from app.repositories.base import BaseRepository


class DailyExpenseRepository(BaseRepository[DailyExpense]):
    def __init__(self, db: AsyncSession):
        super().__init__(DailyExpense, db)

    async def get_filtered(self, date_from: Optional[date] = None, date_to: Optional[date] = None) -> List[DailyExpense]:
        stmt = select(DailyExpense).order_by(DailyExpense.date.desc())
        if date_from:
            stmt = stmt.where(DailyExpense.date >= date_from)
        if date_to:
            stmt = stmt.where(DailyExpense.date <= date_to)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_monthly_total(self, month: int, year: int) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(DailyExpense.amount), 0))
            .where(
                extract("month", DailyExpense.date) == month,
                extract("year", DailyExpense.date) == year,
            )
        )
        return float(result.scalar())


class MaintenanceLogRepository(BaseRepository[MaintenanceLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(MaintenanceLog, db)

    async def get_all_with_machine(self) -> List[dict]:
        result = await self.db.execute(
            select(MaintenanceLog, Machine.name.label("machine_name"))
            .join(Machine, MaintenanceLog.machine_id == Machine.id)
            .order_by(MaintenanceLog.date.desc())
        )
        return [
            {
                "id": row.MaintenanceLog.id, "machine_id": row.MaintenanceLog.machine_id,
                "date": row.MaintenanceLog.date, "cost": row.MaintenanceLog.cost,
                "description": row.MaintenanceLog.description, "type": row.MaintenanceLog.type,
                "created_at": row.MaintenanceLog.created_at,
                "machine_name": row.machine_name,
            }
            for row in result
        ]

    async def get_monthly_total(self, month: int, year: int) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(MaintenanceLog.cost), 0))
            .where(
                extract("month", MaintenanceLog.date) == month,
                extract("year", MaintenanceLog.date) == year,
            )
        )
        return float(result.scalar())
