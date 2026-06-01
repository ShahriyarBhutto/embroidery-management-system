from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Labour(Base):
    __tablename__ = "labour"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    cnic = Column(String(20))
    monthly_salary = Column(Numeric(12, 2), nullable=False)
    joining_date = Column(Date)
    status = Column(String(20), nullable=False, default="active")  # active/inactive
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    shifts = relationship("Shift", back_populates="labour", lazy="select")
    advances = relationship("Advance", back_populates="labour", lazy="select")
