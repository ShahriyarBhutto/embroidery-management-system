from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.inventory import RawMaterialCreate, RawMaterialUpdate, RawMaterialOut, MaterialUsageCreate, MaterialUsageOut
from app.repositories.inventory import RawMaterialRepository, MaterialUsageRepository
from app.auth.dependencies import get_current_user, require_manager
from app.utils.response import ok

router = APIRouter(prefix="/raw-materials", tags=["inventory"])


@router.get("")
async def list_materials(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = RawMaterialRepository(db)
    materials = await repo.get_all_with_flag()
    return ok(materials)


@router.post("")
async def create_material(body: RawMaterialCreate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = RawMaterialRepository(db)
    material = await repo.create(body.model_dump())
    return ok(RawMaterialOut.model_validate(material).model_dump(), "Material created")


@router.get("/{material_id}")
async def get_material(material_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = RawMaterialRepository(db)
    material = await repo.get(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    out = RawMaterialOut.model_validate(material)
    out.is_low_stock = material.current_stock <= material.minimum_stock_alert
    return ok(out.model_dump())


@router.put("/{material_id}")
async def update_material(material_id: int, body: RawMaterialUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = RawMaterialRepository(db)
    material = await repo.update(material_id, body.model_dump(exclude_none=True))
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return ok(RawMaterialOut.model_validate(material).model_dump(), "Material updated")


@router.delete("/{material_id}")
async def delete_material(material_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = RawMaterialRepository(db)
    deleted = await repo.delete(material_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Material not found")
    return ok(message="Material deleted")


@router.post("/{material_id}/usage")
async def record_usage(material_id: int, body: MaterialUsageCreate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    mat_repo = RawMaterialRepository(db)
    material = await mat_repo.get(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if float(material.current_stock) < float(body.quantity_used):
        raise HTTPException(status_code=400, detail="Insufficient stock")

    usage_repo = MaterialUsageRepository(db)
    data = body.model_dump()
    data["material_id"] = material_id
    usage = await usage_repo.create(data)
    await mat_repo.deduct_stock(material_id, float(body.quantity_used))
    return ok(MaterialUsageOut.model_validate(usage).model_dump(), "Usage recorded")
