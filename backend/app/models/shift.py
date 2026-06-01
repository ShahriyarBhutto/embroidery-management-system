from sqlalchemy import Column, Integer, ForeignKey, Date, BigInteger, Text, DateTime, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="RESTRICT"), nullable=False, index=True)
    labour_id = Column(Integer, ForeignKey("labour.id", ondelete="RESTRICT"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    shift_type = Column(String(10), nullable=False)  # day/night
    stitch_count = Column(BigInteger, nullable=False, default=0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    machine = relationship("Machine", back_populates="shifts")
    labour = relationship("Labour", back_populates="shifts")
