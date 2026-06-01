from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
import calendar
from datetime import datetime
from app.database import get_db
from app.models.report_config import ReportConfig
from app.schemas.report import ReportConfigUpdate, ReportConfigOut
from app.repositories.report import ReportRepository
from app.email.service import send_monthly_report
from app.auth.dependencies import require_admin, get_current_user
from app.utils.response import ok

router = APIRouter(prefix="/settings", tags=["settings"])


async def get_or_create_config(db: AsyncSession) -> ReportConfig:
    result = await db.execute(select(ReportConfig).limit(1))
    config = result.scalar_one_or_none()
    if not config:
        config = ReportConfig(recipient_emails=[], send_day=1, send_time="08:00", is_active=False)
        db.add(config)
        await db.flush()
        await db.refresh(config)
    return config


@router.get("/report-config")
async def get_report_config(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    config = await get_or_create_config(db)
    return ok(ReportConfigOut.model_validate(config).model_dump())


@router.put("/report-config")
async def update_report_config(body: ReportConfigUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    config = await get_or_create_config(db)
    updates = body.model_dump(exclude_none=True)
    for key, val in updates.items():
        setattr(config, key, val)
    db.add(config)
    await db.flush()
    await db.refresh(config)
    return ok(ReportConfigOut.model_validate(config).model_dump(), "Config updated")


@router.post("/report-config/test")
async def test_report(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    config = await get_or_create_config(db)
    if not config.recipient_emails:
        raise HTTPException(status_code=400, detail="No recipient emails configured")

    today = date.today()
    repo = ReportRepository(db)
    month = today.month
    year = today.year

    revenue = float(await repo.get_monthly_revenue(month, year))
    expenses = float(await repo.get_monthly_expenses(month, year))
    machine_perf = await repo.get_machine_performance(30)
    top_clients = await repo.get_top_clients(3)
    labour_summary = await repo.get_labour_summary(month, year)
    low_stock = await repo.get_low_stock_materials()

    context = {
        "month_name": calendar.month_name[month],
        "year": year,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "revenue": revenue,
        "expenses": expenses,
        "net_profit": revenue - expenses,
        "total_orders": await repo.get_active_orders_count(),
        "machine_performance": [type("obj", (), m) for m in machine_perf],
        "top_clients": [type("obj", (), c) for c in top_clients],
        "labour_summary": [
            {**s, "monthly_salary": float(s["monthly_salary"]),
             "total_advances": float(s["total_advances"]), "net_payable": float(s["net_payable"])}
            for s in labour_summary
        ],
        "low_stock_materials": low_stock,
    }

    sent = await send_monthly_report(config.recipient_emails, context)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send email. Check SMTP configuration.")
    return ok(message="Test report sent successfully")
