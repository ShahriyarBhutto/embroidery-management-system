from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from typing import List, Optional
from datetime import date
from app.models.shift import Shift
from app.models.machine import Machine
from app.models.labour import Labour
from app.repositories.base import BaseRepository


class ShiftRepository(BaseRepository[Shift]):
    def __init__(self, db: AsyncSession):
        super().__init__(Shift, db)

    async def get_filtered(
        self,
        shift_date: Optional[date] = None,
        machine_id: Optional[int] = None,
        labour_id: Optional[int] = None,
    ) -> List[dict]:
        stmt = (
            select(Shift, Machine.name.label("machine_name"), Labour.name.label("labour_name"))
            .join(Machine, Shift.machine_id == Machine.id)
            .join(Labour, Shift.labour_id == Labour.id)
        )
        if shift_date:
            stmt = stmt.where(Shift.date == shift_date)
        if machine_id:
            stmt = stmt.where(Shift.machine_id == machine_id)
        if labour_id:
            stmt = stmt.where(Shift.labour_id == labour_id)
        stmt = stmt.order_by(Shift.date.desc(), Shift.id.desc())
        result = await self.db.execute(stmt)
        rows = []
        for row in result:
            shift_dict = {
                "id": row.Shift.id,
                "machine_id": row.Shift.machine_id,
                "labour_id": row.Shift.labour_id,
                "date": row.Shift.date,
                "shift_type": row.Shift.shift_type,
                "stitch_count": row.Shift.stitch_count,
                "notes": row.Shift.notes,
                "created_at": row.Shift.created_at,
                "machine_name": row.machine_name,
                "labour_name": row.labour_name,
            }
            rows.append(shift_dict)
        return rows

    async def get_daily_summary(self, summary_date: date) -> dict:
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(Shift.stitch_count), 0).label("total_stitches"),
                func.count(Shift.id).label("total_shifts"),
                func.count(func.distinct(Shift.machine_id)).label("machines_active"),
            ).where(Shift.date == summary_date)
        )
        row = result.one()
        return {
            "date": summary_date,
            "total_stitches": int(row.total_stitches),
            "total_shifts": int(row.total_shifts),
            "machines_active": int(row.machines_active),
        }
