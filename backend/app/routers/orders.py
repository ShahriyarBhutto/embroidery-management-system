from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut, StatusUpdate
from app.repositories.order import OrderRepository
from app.auth.dependencies import get_current_user, require_manager
from app.utils.response import ok

router = APIRouter(prefix="/orders", tags=["orders"])


def _compute_fixed_total(data: dict) -> dict:
    """For fixed_stitches orders, auto-calculate total_amount if not provided."""
    if data.get("order_type") == "fixed_stitches" and not data.get("total_amount"):
        stitches = data.get("actual_stitches") or data.get("estimated_stitches")
        rate = data.get("rate_per_stitch")
        if stitches and rate:
            data["total_amount"] = Decimal(str(stitches)) * rate
    return data


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
    data = _compute_fixed_total(body.model_dump())
    repo = OrderRepository(db)
    order = await repo.create(data)
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
    data = body.model_dump(exclude_none=True)
    # If stitches or rate changed, recalculate total for fixed_stitches orders
    if any(k in data for k in ("actual_stitches", "estimated_stitches", "rate_per_stitch", "order_type")):
        existing = await repo.get(order_id)
        if existing:
            merged = {
                "order_type": existing.order_type,
                "actual_stitches": existing.actual_stitches,
                "estimated_stitches": existing.estimated_stitches,
                "rate_per_stitch": existing.rate_per_stitch,
                "total_amount": existing.total_amount,
                **data,
            }
            computed = _compute_fixed_total(merged)
            if computed.get("total_amount") != existing.total_amount:
                data["total_amount"] = computed["total_amount"]
    order = await repo.update(order_id, data)
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
