from sqlalchemy import Column, Integer, ForeignKey, Date, Numeric, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Advance(Base):
    __tablename__ = "advances"

    id = Column(Integer, primary_key=True, index=True)
    labour_id = Column(Integer, ForeignKey("labour.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    labour = relationship("Labour", back_populates="advances")
