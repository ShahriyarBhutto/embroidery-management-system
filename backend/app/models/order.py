from sqlalchemy import Column, Integer, ForeignKey, String, Numeric, BigInteger, Date, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="SET NULL"), index=True)
    design_name = Column(String(255), nullable=False)
    order_type = Column(String(20), nullable=False)  # estimated/fixed_stitches
    estimated_stitches = Column(BigInteger)
    actual_stitches = Column(BigInteger)
    rate_per_stitch = Column(Numeric(10, 4))
    total_amount = Column(Numeric(12, 2))
    advance_payment = Column(Numeric(12, 2), default=0)
    status = Column(String(20), nullable=False, default="pending")  # pending/in_progress/completed/delivered
    order_date = Column(Date, nullable=False)
    deadline = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client", back_populates="orders")
    machine = relationship("Machine", back_populates="orders")
    material_usages = relationship("MaterialUsage", back_populates="order", lazy="select")
