from sqlalchemy import Column, Integer, ForeignKey, String, Numeric, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class RawMaterial(Base):
    __tablename__ = "raw_materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    unit = Column(String(50), nullable=False)  # kg/meters/pieces/etc
    current_stock = Column(Numeric(12, 3), nullable=False, default=0)
    cost_per_unit = Column(Numeric(12, 2), nullable=False)
    minimum_stock_alert = Column(Numeric(12, 3), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    usages = relationship("MaterialUsage", back_populates="material", lazy="select")


class MaterialUsage(Base):
    __tablename__ = "material_usages"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("raw_materials.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity_used = Column(Numeric(12, 3), nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="material_usages")
    material = relationship("RawMaterial", back_populates="usages")
