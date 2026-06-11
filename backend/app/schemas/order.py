from pydantic import BaseModel, model_validator
from typing import Optional, Any
from datetime import date, datetime
from decimal import Decimal


def _strip_empty_strings(data: Any) -> Any:
    """Convert empty strings to None so Pydantic doesn't reject them as invalid numbers/dates."""
    if isinstance(data, dict):
        return {k: (None if v == "" else v) for k, v in data.items()}
    return data


class OrderCreate(BaseModel):
    client_id: int
    machine_id: Optional[int] = None
    design_name: str
    order_type: str  # estimated/fixed_stitches
    estimated_stitches: Optional[int] = None
    actual_stitches: Optional[int] = None
    rate_per_stitch: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    advance_payment: Optional[Decimal] = 0
    order_date: date
    deadline: Optional[date] = None
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def coerce_empty_strings(cls, data: Any) -> Any:
        return _strip_empty_strings(data)


class OrderUpdate(BaseModel):
    machine_id: Optional[int] = None
    design_name: Optional[str] = None
    order_type: Optional[str] = None
    estimated_stitches: Optional[int] = None
    actual_stitches: Optional[int] = None
    rate_per_stitch: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    advance_payment: Optional[Decimal] = None
    status: Optional[str] = None
    deadline: Optional[date] = None
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def coerce_empty_strings(cls, data: Any) -> Any:
        return _strip_empty_strings(data)


class OrderOut(BaseModel):
    id: int
    client_id: int
    machine_id: Optional[int]
    design_name: str
    order_type: str
    estimated_stitches: Optional[int]
    actual_stitches: Optional[int]
    rate_per_stitch: Optional[Decimal]
    total_amount: Optional[Decimal]
    advance_payment: Optional[Decimal]
    status: str
    order_date: date
    deadline: Optional[date]
    notes: Optional[str]
    client_name: Optional[str] = None
    machine_name: Optional[str] = None
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class StatusUpdate(BaseModel):
    status: str
