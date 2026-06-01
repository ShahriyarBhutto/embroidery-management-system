from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from app.models.raw_material import RawMaterial, MaterialUsage
from app.models.order import Order
from app.repositories.base import BaseRepository


class RawMaterialRepository(BaseRepository[RawMaterial]):
    def __init__(self, db: AsyncSession):
        super().__init__(RawMaterial, db)

    async def get_all_with_flag(self) -> List[dict]:
        result = await self.db.execute(select(RawMaterial).order_by(RawMaterial.name))
        materials = result.scalars().all()
        return [
            {
                "id": m.id, "name": m.name, "unit": m.unit,
                "current_stock": m.current_stock, "cost_per_unit": m.cost_per_unit,
                "minimum_stock_alert": m.minimum_stock_alert, "created_at": m.created_at,
                "is_low_stock": m.current_stock <= m.minimum_stock_alert,
            }
            for m in materials
        ]

    async def deduct_stock(self, material_id: int, quantity: float):
        await self.db.execute(
            update(RawMaterial)
            .where(RawMaterial.id == material_id)
            .values(current_stock=RawMaterial.current_stock - quantity)
        )


class MaterialUsageRepository(BaseRepository[MaterialUsage]):
    def __init__(self, db: AsyncSession):
        super().__init__(MaterialUsage, db)

    async def get_by_order(self, order_id: int) -> List[dict]:
        result = await self.db.execute(
            select(MaterialUsage, RawMaterial.name.label("material_name"), RawMaterial.unit)
            .join(RawMaterial, MaterialUsage.material_id == RawMaterial.id)
            .where(MaterialUsage.order_id == order_id)
        )
        return [
            {
                "id": row.MaterialUsage.id, "order_id": row.MaterialUsage.order_id,
                "material_id": row.MaterialUsage.material_id,
                "quantity_used": row.MaterialUsage.quantity_used,
                "date": row.MaterialUsage.date,
                "material_name": row.material_name, "unit": row.unit,
            }
            for row in result
        ]
