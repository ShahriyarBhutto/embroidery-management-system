from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from typing import List, Optional
from datetime import date
from app.models.order import Order
from app.models.client import Client
from app.models.machine import Machine
from app.repositories.base import BaseRepository


class OrderRepository(BaseRepository[Order]):
    def __init__(self, db: AsyncSession):
        super().__init__(Order, db)

    async def get_filtered(
        self,
        client_id: Optional[int] = None,
        status: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[dict]:
        stmt = (
            select(Order, Client.name.label("client_name"), Machine.name.label("machine_name"))
            .join(Client, Order.client_id == Client.id)
            .outerjoin(Machine, Order.machine_id == Machine.id)
        )
        if client_id:
            stmt = stmt.where(Order.client_id == client_id)
        if status:
            stmt = stmt.where(Order.status == status)
        if date_from:
            stmt = stmt.where(Order.order_date >= date_from)
        if date_to:
            stmt = stmt.where(Order.order_date <= date_to)
        stmt = stmt.order_by(Order.order_date.desc())
        result = await self.db.execute(stmt)
        rows = []
        for row in result:
            o = row.Order
            rows.append({
                "id": o.id, "client_id": o.client_id, "machine_id": o.machine_id,
                "design_name": o.design_name, "order_type": o.order_type,
                "estimated_stitches": o.estimated_stitches, "actual_stitches": o.actual_stitches,
                "rate_per_stitch": o.rate_per_stitch, "total_amount": o.total_amount,
                "advance_payment": o.advance_payment, "status": o.status,
                "order_date": o.order_date, "deadline": o.deadline, "notes": o.notes,
                "created_at": o.created_at,
                "client_name": row.client_name, "machine_name": row.machine_name,
            })
        return rows

    async def get_with_details(self, order_id: int) -> Optional[dict]:
        rows = await self.get_filtered()
        for r in rows:
            if r["id"] == order_id:
                return r
        return None

    async def get_by_client(self, client_id: int) -> List[dict]:
        return await self.get_filtered(client_id=client_id)

    async def get_recent(self, limit: int = 5) -> List[dict]:
        stmt = (
            select(Order, Client.name.label("client_name"))
            .join(Client, Order.client_id == Client.id)
            .order_by(Order.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return [
            {
                "id": row.Order.id, "client_name": row.client_name,
                "design_name": row.Order.design_name, "status": row.Order.status,
                "total_amount": row.Order.total_amount, "order_date": row.Order.order_date,
            }
            for row in result
        ]
