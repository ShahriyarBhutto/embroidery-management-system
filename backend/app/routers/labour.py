from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
from app.database import get_db
from app.schemas.labour import LabourCreate, LabourUpdate, LabourOut, AdvanceCreate, AdvanceOut, SalarySummary
from app.repositories.labour import LabourRepository, AdvanceRepository
from app.auth.dependencies import get_current_user, require_manager
from app.utils.response import ok

router = APIRouter(prefix="/labour", tags=["labour"])


@router.get("")
async def list_labour(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = LabourRepository(db)
    labours = await repo.get_all()
    return ok([LabourOut.model_validate(l).model_dump() for l in labours])


@router.post("")
async def create_labour(body: LabourCreate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = LabourRepository(db)
    labour = await repo.create(body.model_dump())
    return ok(LabourOut.model_validate(labour).model_dump(), "Labour created")


@router.get("/{labour_id}")
async def get_labour(labour_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = LabourRepository(db)
    labour = await repo.get(labour_id)
    if not labour:
        raise HTTPException(status_code=404, detail="Labour not found")
    return ok(LabourOut.model_validate(labour).model_dump())


@router.put("/{labour_id}")
async def update_labour(labour_id: int, body: LabourUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = LabourRepository(db)
    labour = await repo.update(labour_id, body.model_dump(exclude_none=True))
    if not labour:
        raise HTTPException(status_code=404, detail="Labour not found")
    return ok(LabourOut.model_validate(labour).model_dump(), "Labour updated")


@router.delete("/{labour_id}")
async def delete_labour(labour_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = LabourRepository(db)
    deleted = await repo.delete(labour_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Labour not found")
    return ok(message="Labour deleted")


@router.post("/{labour_id}/advance")
async def record_advance(labour_id: int, body: AdvanceCreate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    labour_repo = LabourRepository(db)
    labour = await labour_repo.get(labour_id)
    if not labour:
        raise HTTPException(status_code=404, detail="Labour not found")
    adv_repo = AdvanceRepository(db)
    data = body.model_dump()
    data["labour_id"] = labour_id
    advance = await adv_repo.create(data)
    return ok(AdvanceOut.model_validate(advance).model_dump(), "Advance recorded")


@router.get("/{labour_id}/salary-summary")
async def salary_summary(
    labour_id: int,
    month: int = Query(default=date.today().month, ge=1, le=12),
    year: int = Query(default=date.today().year),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    labour_repo = LabourRepository(db)
    labour = await labour_repo.get(labour_id)
    if not labour:
        raise HTTPException(status_code=404, detail="Labour not found")

    adv_repo = AdvanceRepository(db)
    total_advances = await adv_repo.get_monthly_total(labour_id, month, year)
    advances = await adv_repo.get_monthly_advances(labour_id, month, year)

    summary = SalarySummary(
        labour_id=labour_id,
        labour_name=labour.name,
        monthly_salary=labour.monthly_salary,
        total_advances=total_advances,
        net_payable=float(labour.monthly_salary) - total_advances,
        advance_history=[AdvanceOut.model_validate(a) for a in advances],
    )
    return ok(summary.model_dump())
