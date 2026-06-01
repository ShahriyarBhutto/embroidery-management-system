from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class RawMaterialCreate(BaseModel):
    name: str
    unit: str
    current_stock: Decimal = Decimal("0")
    cost_per_unit: Decimal
    minimum_stock_alert: Decimal = Decimal("0")


class RawMaterialUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    current_stock: Optional[Decimal] = None
    cost_per_unit: Optional[Decimal] = None
    minimum_stock_alert: Optional[Decimal] = None


class RawMaterialOut(BaseModel):
    id: int
    name: str
    unit: str
    current_stock: Decimal
    cost_per_unit: Decimal
    minimum_stock_alert: Decimal
    is_low_stock: bool = False
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_flag(cls, obj):
        data = cls.model_validate(obj)
        data.is_low_stock = obj.current_stock <= obj.minimum_stock_alert
        return data


class MaterialUsageCreate(BaseModel):
    order_id: int
    material_id: int
    quantity_used: Decimal
    date: date


class MaterialUsageOut(BaseModel):
    id: int
    order_id: int
    material_id: int
    quantity_used: Decimal
    date: date
    material_name: Optional[str] = None
    unit: Optional[str] = None

    model_config = {"from_attributes": True}
