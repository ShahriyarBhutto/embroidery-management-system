from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
from app.database import get_db
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut, StatusUpdate
from app.repositories.order import OrderRepository
from app.auth.dependencies import get_current_user, require_manager
from app.utils.response import ok

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("")
async def list_orders(
    client_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    repo = OrderRepository(db)
    orders = await repo.get_filtered(client_id, status, date_from, date_to)
    return ok(orders)


@router.post("")
async def create_order(body: OrderCreate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = OrderRepository(db)
    order = await repo.create(body.model_dump())
    return ok({"id": order.id}, "Order created")


@router.get("/{order_id}")
async def get_order(order_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = OrderRepository(db)
    order = await repo.get_with_details(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return ok(order)


@router.put("/{order_id}")
async def update_order(order_id: int, body: OrderUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = OrderRepository(db)
    order = await repo.update(order_id, body.model_dump(exclude_none=True))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return ok({"id": order.id}, "Order updated")


@router.patch("/{order_id}/status")
async def update_order_status(order_id: int, body: StatusUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    valid = {"pending", "in_progress", "completed", "delivered"}
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")
    repo = OrderRepository(db)
    order = await repo.update(order_id, {"status": body.status})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return ok({"id": order.id, "status": order.status}, "Status updated")


@router.delete("/{order_id}")
async def delete_order(order_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = OrderRepository(db)
    deleted = await repo.delete(order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Order not found")
    return ok(message="Order deleted")
