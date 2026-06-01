from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
from app.database import get_db
from app.schemas.expense import (
    DailyExpenseCreate, DailyExpenseUpdate, DailyExpenseOut,
    MaintenanceLogCreate, MaintenanceLogUpdate, MaintenanceLogOut,
)
from app.repositories.expense import DailyExpenseRepository, MaintenanceLogRepository
from app.auth.dependencies import get_current_user, require_manager
from app.utils.response import ok

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/daily")
async def list_daily_expenses(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    repo = DailyExpenseRepository(db)
    expenses = await repo.get_filtered(date_from, date_to)
    return ok([DailyExpenseOut.model_validate(e).model_dump() for e in expenses])


@router.post("/daily")
async def create_daily_expense(body: DailyExpenseCreate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = DailyExpenseRepository(db)
    expense = await repo.create(body.model_dump())
    return ok(DailyExpenseOut.model_validate(expense).model_dump(), "Expense recorded")


@router.put("/daily/{expense_id}")
async def update_daily_expense(expense_id: int, body: DailyExpenseUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = DailyExpenseRepository(db)
    expense = await repo.update(expense_id, body.model_dump(exclude_none=True))
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return ok(DailyExpenseOut.model_validate(expense).model_dump(), "Expense updated")


@router.delete("/daily/{expense_id}")
async def delete_daily_expense(expense_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = DailyExpenseRepository(db)
    deleted = await repo.delete(expense_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")
    return ok(message="Expense deleted")


@router.get("/maintenance")
async def list_maintenance_logs(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = MaintenanceLogRepository(db)
    logs = await repo.get_all_with_machine()
    return ok(logs)


@router.post("/maintenance")
async def create_maintenance_log(body: MaintenanceLogCreate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = MaintenanceLogRepository(db)
    log = await repo.create(body.model_dump())
    return ok(MaintenanceLogOut.model_validate(log).model_dump(), "Maintenance log added")


@router.put("/maintenance/{log_id}")
async def update_maintenance_log(log_id: int, body: MaintenanceLogUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = MaintenanceLogRepository(db)
    log = await repo.update(log_id, body.model_dump(exclude_none=True))
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return ok(MaintenanceLogOut.model_validate(log).model_dump(), "Log updated")


@router.delete("/maintenance/{log_id}")
async def delete_maintenance_log(log_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = MaintenanceLogRepository(db)
    deleted = await repo.delete(log_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Log not found")
    return ok(message="Log deleted")
