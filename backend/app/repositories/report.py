from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, extract, case
from sqlalchemy.orm import aliased
from typing import List
from datetime import date, datetime, timedelta
from decimal import Decimal
from app.models.shift import Shift
from app.models.machine import Machine
from app.models.order import Order
from app.models.client import Client
from app.models.expense import DailyExpense, MaintenanceLog
from app.models.labour import Labour
from app.models.advance import Advance
from app.models.raw_material import RawMaterial


class ReportRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_today_stitches(self) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.sum(Shift.stitch_count), 0))
            .where(Shift.date == date.today())
        )
        return int(result.scalar())

    async def get_active_orders_count(self) -> int:
        result = await self.db.execute(
            select(func.count(Order.id)).where(Order.status.in_(["pending", "in_progress"]))
        )
        return int(result.scalar())

    async def get_monthly_revenue(self, month: int, year: int) -> Decimal:
        result = await self.db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0))
            .where(
                Order.status.in_(["completed", "delivered"]),
                extract("month", Order.order_date) == month,
                extract("year", Order.order_date) == year,
            )
        )
        return Decimal(str(result.scalar()))

    async def get_monthly_expenses(self, month: int, year: int) -> Decimal:
        r1 = await self.db.execute(
            select(func.coalesce(func.sum(DailyExpense.amount), 0))
            .where(
                extract("month", DailyExpense.date) == month,
                extract("year", DailyExpense.date) == year,
            )
        )
        r2 = await self.db.execute(
            select(func.coalesce(func.sum(MaintenanceLog.cost), 0))
            .where(
                extract("month", MaintenanceLog.date) == month,
                extract("year", MaintenanceLog.date) == year,
            )
        )
        return Decimal(str(r1.scalar())) + Decimal(str(r2.scalar()))

    async def get_machine_performance(self, days: int = 30) -> List[dict]:
        since = date.today() - timedelta(days=days)
        result = await self.db.execute(
            select(Machine.name, func.coalesce(func.sum(Shift.stitch_count), 0).label("total_stitches"))
            .outerjoin(Shift, (Shift.machine_id == Machine.id) & (Shift.date >= since))
            .where(Machine.status == "active")
            .group_by(Machine.id, Machine.name)
            .order_by(func.sum(Shift.stitch_count).desc().nullslast())
        )
        return [{"machine_name": row.name, "total_stitches": int(row.total_stitches)} for row in result]

    async def get_six_month_trend(self) -> List[dict]:
        trends = []
        today = date.today()
        for i in range(5, -1, -1):
            month = (today.month - i - 1) % 12 + 1
            year = today.year - ((today.month - i - 1) // 12)
            rev = await self.get_monthly_revenue(month, year)
            exp = await self.get_monthly_expenses(month, year)
            trends.append({
                "month": f"{year}-{month:02d}",
                "revenue": rev,
                "expenses": exp,
            })
        return trends

    async def get_order_status_distribution(self) -> List[dict]:
        result = await self.db.execute(
            select(Order.status, func.count(Order.id).label("count"))
            .group_by(Order.status)
        )
        return [{"status": row.status, "count": int(row.count)} for row in result]

    async def get_labour_summary(self, month: int, year: int) -> List[dict]:
        labours_result = await self.db.execute(select(Labour).where(Labour.status == "active"))
        labours = labours_result.scalars().all()
        summary = []
        for labour in labours:
            adv_result = await self.db.execute(
                select(func.coalesce(func.sum(Advance.amount), 0))
                .where(
                    Advance.labour_id == labour.id,
                    extract("month", Advance.date) == month,
                    extract("year", Advance.date) == year,
                )
            )
            total_advances = Decimal(str(adv_result.scalar()))
            summary.append({
                "labour_id": labour.id,
                "name": labour.name,
                "monthly_salary": labour.monthly_salary,
                "total_advances": total_advances,
                "net_payable": labour.monthly_salary - total_advances,
            })
        return summary

    async def get_top_clients(self, limit: int = 3) -> List[dict]:
        result = await self.db.execute(
            select(Client.name, func.coalesce(func.sum(Order.total_amount), 0).label("total_value"))
            .join(Order, Order.client_id == Client.id)
            .group_by(Client.id, Client.name)
            .order_by(func.sum(Order.total_amount).desc())
            .limit(limit)
        )
        return [{"client_name": row.name, "total_value": Decimal(str(row.total_value))} for row in result]

    async def get_low_stock_materials(self) -> List[dict]:
        result = await self.db.execute(
            select(RawMaterial)
            .where(RawMaterial.current_stock <= RawMaterial.minimum_stock_alert)
            .order_by(RawMaterial.name)
        )
        materials = result.scalars().all()
        return [
            {"name": m.name, "unit": m.unit, "current_stock": m.current_stock, "minimum_stock_alert": m.minimum_stock_alert}
            for m in materials
        ]

    async def get_config(self):
        from app.models.report_config import ReportConfig
        result = await self.db.execute(select(ReportConfig).limit(1))
        return result.scalar_one_or_none()
