from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClientCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientOut(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    company_name: Optional[str]
    address: Optional[str]
    notes: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}
