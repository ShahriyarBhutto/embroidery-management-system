from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
from app.database import get_db
from app.repositories.report import ReportRepository
from app.auth.dependencies import get_current_user
from app.utils.response import ok

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = ReportRepository(db)
    today = date.today()
    cards = {
        "today_stitches": await repo.get_today_stitches(),
        "active_orders": await repo.get_active_orders_count(),
        "monthly_revenue": float(await repo.get_monthly_revenue(today.month, today.year)),
        "monthly_expenses": float(await repo.get_monthly_expenses(today.month, today.year)),
    }
    from app.repositories.order import OrderRepository
    order_repo = OrderRepository(db)
    recent = await order_repo.get_recent(5)
    return ok({
        "cards": cards,
        "machine_performance": await repo.get_machine_performance(30),
        "monthly_trend": [
            {**t, "revenue": float(t["revenue"]), "expenses": float(t["expenses"])}
            for t in await repo.get_six_month_trend()
        ],
        "order_status": await repo.get_order_status_distribution(),
        "recent_orders": [
            {**r, "total_amount": float(r["total_amount"] or 0), "order_date": str(r["order_date"])}
            for r in recent
        ],
    })


@router.get("/machines")
async def machines_report(
    period: str = Query("monthly", regex="^(daily|weekly|monthly|quarterly|yearly)$"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    days = {"daily": 1, "weekly": 7, "monthly": 30, "quarterly": 90, "yearly": 365}[period]
    repo = ReportRepository(db)
    return ok(await repo.get_machine_performance(days))


@router.get("/labour")
async def labour_report(
    month: int = Query(default=date.today().month, ge=1, le=12),
    year: int = Query(default=date.today().year),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    repo = ReportRepository(db)
    summary = await repo.get_labour_summary(month, year)
    return ok([
        {**s, "monthly_salary": float(s["monthly_salary"]), "total_advances": float(s["total_advances"]), "net_payable": float(s["net_payable"])}
        for s in summary
    ])


@router.get("/revenue")
async def revenue_report(
    period: str = Query("monthly"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    repo = ReportRepository(db)
    trend = await repo.get_six_month_trend()
    return ok([
        {**t, "revenue": float(t["revenue"]), "expenses": float(t["expenses"])}
        for t in trend
    ])


@router.get("/expenses")
async def expenses_report(
    period: str = Query("monthly"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    repo = ReportRepository(db)
    trend = await repo.get_six_month_trend()
    return ok([{"month": t["month"], "expenses": float(t["expenses"])} for t in trend])


@router.get("/profit-loss")
async def profit_loss_report(
    period: str = Query("monthly"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    today = date.today()
    repo = ReportRepository(db)
    revenue = float(await repo.get_monthly_revenue(today.month, today.year))
    expenses = float(await repo.get_monthly_expenses(today.month, today.year))
    return ok({
        "period": period,
        "revenue": revenue,
        "expenses": expenses,
        "profit_loss": revenue - expenses,
        "is_profit": revenue >= expenses,
    })
