from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.schemas.machine import MachineCreate, MachineUpdate, MachineOut
from app.schemas.expense import MaintenanceLogCreate, MaintenanceLogOut
from app.repositories.machine import MachineRepository, MaintenanceLogRepository
from app.repositories.expense import MaintenanceLogRepository as ExpenseMaintenanceRepo
from app.auth.dependencies import get_current_user, require_manager
from app.models.user import User
from app.utils.response import ok, fail

router = APIRouter(prefix="/machines", tags=["machines"])


@router.get("")
async def list_machines(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = MachineRepository(db)
    machines = await repo.get_all()
    return ok([MachineOut.model_validate(m).model_dump() for m in machines])


@router.post("")
async def create_machine(body: MachineCreate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = MachineRepository(db)
    machine = await repo.create(body.model_dump())
    return ok(MachineOut.model_validate(machine).model_dump(), "Machine created")


@router.get("/{machine_id}")
async def get_machine(machine_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = MachineRepository(db)
    machine = await repo.get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return ok(MachineOut.model_validate(machine).model_dump())


@router.put("/{machine_id}")
async def update_machine(machine_id: int, body: MachineUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = MachineRepository(db)
    machine = await repo.update(machine_id, body.model_dump(exclude_none=True))
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return ok(MachineOut.model_validate(machine).model_dump(), "Machine updated")


@router.delete("/{machine_id}")
async def delete_machine(machine_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = MachineRepository(db)
    deleted = await repo.delete(machine_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Machine not found")
    return ok(message="Machine deleted")


@router.get("/{machine_id}/performance")
async def machine_performance(
    machine_id: int,
    period: str = Query("monthly", regex="^(daily|weekly|monthly|quarterly|yearly)$"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    repo = MachineRepository(db)
    perf = await repo.get_performance(machine_id, period)
    history = await repo.get_stitch_history(machine_id)
    return ok({"performance": perf, "stitch_history": history})


@router.get("/{machine_id}/maintenance")
async def get_maintenance_logs(machine_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = MaintenanceLogRepository(db)
    logs = await repo.get_by_machine(machine_id)
    return ok([MaintenanceLogOut.model_validate(l).model_dump() for l in logs])


@router.post("/{machine_id}/maintenance")
async def add_maintenance_log(
    machine_id: int, body: MaintenanceLogCreate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)
):
    repo = ExpenseMaintenanceRepo(db)
    data = body.model_dump()
    data["machine_id"] = machine_id
    log = await repo.create(data)
    return ok(MaintenanceLogOut.model_validate(log).model_dump(), "Maintenance log added")
