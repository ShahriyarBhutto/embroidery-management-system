from sqlalchemy import Column, Integer, String, Date, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    model_number = Column(String(100))
    status = Column(String(20), nullable=False, default="active")  # active/idle/maintenance
    purchase_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    shifts = relationship("Shift", back_populates="machine", lazy="select")
    orders = relationship("Order", back_populates="machine", lazy="select")
    maintenance_logs = relationship("MaintenanceLog", back_populates="machine", lazy="select")
