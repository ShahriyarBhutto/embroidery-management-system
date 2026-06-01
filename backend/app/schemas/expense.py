from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class DailyExpenseCreate(BaseModel):
    category: str  # electricity/rent/transport/misc
    amount: Decimal
    date: date
    description: Optional[str] = None


class DailyExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[Decimal] = None
    date: Optional[date] = None
    description: Optional[str] = None


class DailyExpenseOut(BaseModel):
    id: int
    category: str
    amount: Decimal
    date: date
    description: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class MaintenanceLogCreate(BaseModel):
    machine_id: int
    date: date
    cost: Decimal = Decimal("0")
    description: Optional[str] = None
    type: str  # routine/breakdown/upgrade


class MaintenanceLogUpdate(BaseModel):
    cost: Optional[Decimal] = None
    description: Optional[str] = None
    type: Optional[str] = None
    date: Optional[date] = None


class MaintenanceLogOut(BaseModel):
    id: int
    machine_id: int
    date: date
    cost: Decimal
    description: Optional[str]
    type: str
    machine_name: Optional[str] = None
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}
