from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
from app.database import get_db
from app.schemas.shift import ShiftCreate, ShiftUpdate, ShiftOut, DailySummary
from app.repositories.shift import ShiftRepository
from app.auth.dependencies import get_current_user, require_manager
from app.utils.response import ok

router = APIRouter(prefix="/shifts", tags=["shifts"])


@router.get("")
async def list_shifts(
    shift_date: Optional[date] = Query(None, alias="date"),
    machine_id: Optional[int] = None,
    labour_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    repo = ShiftRepository(db)
    shifts = await repo.get_filtered(shift_date, machine_id, labour_id)
    return ok(shifts)


@router.post("")
async def create_shift(body: ShiftCreate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = ShiftRepository(db)
    shift = await repo.create(body.model_dump())
    data = await repo.get_filtered(shift.date, shift.machine_id)
    entry = next((s for s in data if s["id"] == shift.id), None)
    return ok(entry, "Shift recorded")


@router.put("/{shift_id}")
async def update_shift(shift_id: int, body: ShiftUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = ShiftRepository(db)
    shift = await repo.update(shift_id, body.model_dump(exclude_none=True))
    return ok({"id": shift.id} if shift else None, "Shift updated")


@router.delete("/{shift_id}")
async def delete_shift(shift_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = ShiftRepository(db)
    await repo.delete(shift_id)
    return ok(message="Shift deleted")


@router.get("/daily-summary")
async def daily_summary(
    summary_date: date = Query(default=date.today(), alias="date"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    repo = ShiftRepository(db)
    summary = await repo.get_daily_summary(summary_date)
    return ok(summary)
