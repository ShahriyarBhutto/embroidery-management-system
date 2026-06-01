from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


class LabourCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    cnic: Optional[str] = None
    monthly_salary: Decimal
    joining_date: Optional[date] = None
    status: str = "active"


class LabourUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    cnic: Optional[str] = None
    monthly_salary: Optional[Decimal] = None
    joining_date: Optional[date] = None
    status: Optional[str] = None


class LabourOut(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    cnic: Optional[str]
    monthly_salary: Decimal
    joining_date: Optional[date]
    status: str
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class AdvanceCreate(BaseModel):
    amount: Decimal
    date: date
    notes: Optional[str] = None


class AdvanceOut(BaseModel):
    id: int
    labour_id: int
    amount: Decimal
    date: date
    notes: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class SalarySummary(BaseModel):
    labour_id: int
    labour_name: str
    monthly_salary: Decimal
    total_advances: Decimal
    net_payable: Decimal
    advance_history: List[AdvanceOut]
