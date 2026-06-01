from sqlalchemy import Column, Integer, ForeignKey, String, Numeric, Date, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DailyExpense(Base):
    __tablename__ = "daily_expenses"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(30), nullable=False)  # electricity/rent/transport/misc
    amount = Column(Numeric(12, 2), nullable=False)
    date = Column(Date, nullable=False, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    cost = Column(Numeric(12, 2), nullable=False, default=0)
    description = Column(Text)
    type = Column(String(20), nullable=False)  # routine/breakdown/upgrade
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    machine = relationship("Machine", back_populates="maintenance_logs")
