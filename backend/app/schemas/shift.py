from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ShiftCreate(BaseModel):
    machine_id: int
    labour_id: int
    date: date
    shift_type: str  # day/night
    stitch_count: int
    notes: Optional[str] = None


class ShiftUpdate(BaseModel):
    stitch_count: Optional[int] = None
    notes: Optional[str] = None
    shift_type: Optional[str] = None


class ShiftOut(BaseModel):
    id: int
    machine_id: int
    labour_id: int
    date: date
    shift_type: str
    stitch_count: int
    notes: Optional[str]
    created_at: Optional[datetime]
    machine_name: Optional[str] = None
    labour_name: Optional[str] = None

    model_config = {"from_attributes": True}


class DailySummary(BaseModel):
    date: date
    total_stitches: int
    total_shifts: int
    machines_active: int
