from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class ReportConfig(Base):
    __tablename__ = "report_configs"

    id = Column(Integer, primary_key=True, index=True)
    recipient_emails = Column(JSON, nullable=False, default=list)
    send_day = Column(Integer, nullable=False, default=1)  # day of month 1-28
    send_time = Column(String(5), nullable=False, default="08:00")  # HH:MM
    is_active = Column(Boolean, nullable=False, default=True)
    last_sent_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
