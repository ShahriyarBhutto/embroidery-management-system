from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class ReportConfigUpdate(BaseModel):
    recipient_emails: Optional[List[str]] = None
    send_day: Optional[int] = None
    send_time: Optional[str] = None
    is_active: Optional[bool] = None


class ReportConfigOut(BaseModel):
    id: int
    recipient_emails: List[str]
    send_day: int
    send_time: str
    is_active: bool
    last_sent_at: Optional[datetime]

    model_config = {"from_attributes": True}


class DashboardCard(BaseModel):
    today_stitches: int
    active_orders: int
    monthly_revenue: Decimal
    monthly_expenses: Decimal


class MachinePerf(BaseModel):
    machine_name: str
    total_stitches: int


class MonthlyTrend(BaseModel):
    month: str
    revenue: Decimal
    expenses: Decimal


class OrderStatusDist(BaseModel):
    status: str
    count: int


class DashboardData(BaseModel):
    cards: DashboardCard
    machine_performance: List[MachinePerf]
    monthly_trend: List[MonthlyTrend]
    order_status: List[OrderStatusDist]
    recent_orders: List[dict]
