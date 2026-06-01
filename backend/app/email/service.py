import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from typing import List
from datetime import datetime
from app.config import settings

_template_dir = Path(__file__).parent / "templates"
_jinja_env = Environment(loader=FileSystemLoader(str(_template_dir)))

# Make enumerate available in Jinja2 templates
_jinja_env.globals["enumerate"] = enumerate


def render_report_html(context: dict) -> str:
    template = _jinja_env.get_template("monthly_report.html")
    return template.render(**context)


async def send_monthly_report(recipients: List[str], context: dict) -> bool:
    if not recipients or not settings.MAIL_USERNAME:
        return False

    html_body = render_report_html(context)
    month_name = context.get("month_name", "")
    year = context.get("year", "")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Monthly Report — {month_name} {year}"
    msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    msg["To"] = ", ".join(recipients)
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as smtp:
            if settings.MAIL_STARTTLS:
                smtp.starttls()
            smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            smtp.sendmail(settings.MAIL_FROM, recipients, msg.as_string())
        return True
    except Exception as exc:
        print(f"[Email] Failed to send: {exc}")
        return False
