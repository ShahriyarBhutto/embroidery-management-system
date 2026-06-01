from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class MachineCreate(BaseModel):
    name: str
    model_number: Optional[str] = None
    status: str = "active"
    purchase_date: Optional[date] = None
    notes: Optional[str] = None


class MachineUpdate(BaseModel):
    name: Optional[str] = None
    model_number: Optional[str] = None
    status: Optional[str] = None
    purchase_date: Optional[date] = None
    notes: Optional[str] = None


class MachineOut(BaseModel):
    id: int
    name: str
    model_number: Optional[str]
    status: str
    purchase_date: Optional[date]
    notes: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class MaintenanceLogCreate(BaseModel):
    machine_id: int
    date: date
    cost: float = 0
    description: Optional[str] = None
    type: str  # routine/breakdown/upgrade


class MaintenanceLogOut(BaseModel):
    id: int
    machine_id: int
    date: date
    cost: float
    description: Optional[str]
    type: str
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}
