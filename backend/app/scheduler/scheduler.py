from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, date
from sqlalchemy import select
from app.database import async_session_maker
from app.models.report_config import ReportConfig
from app.repositories.report import ReportRepository
from app.email.service import send_monthly_report
import calendar

scheduler = AsyncIOScheduler()


async def send_scheduled_report():
    async with async_session_maker() as db:
        result = await db.execute(select(ReportConfig).limit(1))
        config = result.scalar_one_or_none()

        if not config or not config.is_active or not config.recipient_emails:
            return

        today = date.today()
        if today.day != config.send_day:
            return

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
        if sent:
            from sqlalchemy import update
            await db.execute(
                update(ReportConfig).where(ReportConfig.id == config.id).values(last_sent_at=datetime.now())
            )
            await db.commit()


def start_scheduler():
    scheduler.add_job(
        send_scheduled_report,
        trigger=CronTrigger(hour="*", minute=0),  # Check every hour; logic inside checks exact day
        id="monthly_report",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
