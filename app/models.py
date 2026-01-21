from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, event
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
import math

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    bills = relationship("Bill", back_populates="creator")

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    total_amount = Column(Float, nullable=False)
    tax = Column(Float, default=0.0)
    tip = Column(Float, default=0.0)
    tip_split_evenly = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    creator = relationship("User", back_populates="bills")

    def total_with_tax_tip(self) -> float:
        return round(self.total_amount + self.tax + self.tip, 2)

def truncate_2(value: float) -> float:
    return math.floor(value * 100) / 100

@event.listens_for(Bill, "before_insert")
@event.listens_for(Bill, "before_update")
def truncate_bill_amounts(mapper, connection, target):
    target.total_amount = truncate_2(float(target.total_amount))
    target.tax = truncate_2(float(target.tax or 0))
    target.tip = truncate_2(float(target.tip or 0))

class BillShare(Base):
    __tablename__ = "bill_shares"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    owes_amount = Column(Float, nullable=False)

    owner = relationship("User")

@event.listens_for(BillShare, "before_insert")
@event.listens_for(BillShare, "before_update")
def truncate_bill_amounts(mapper, connection, target):
    target.owes_amount = truncate_2(float(target.owes_amount))