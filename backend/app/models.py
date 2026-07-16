from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="member", nullable=False) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class InviteToken(Base):
    __tablename__ = "invite_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False) 
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

class MetricValue(Base):
    __tablename__ = "metric_values"

    id = Column(Integer, primary_key=True, index=True)
    sheet = Column(String, nullable=False)
    category = Column(String, nullable=False) 
    metric_name = Column(String, nullable=False)
    brand = Column(String, default="Asian Paints")
    market = Column(String, default="All India")
    channel = Column(String, default="All")
    period = Column(String, nullable=False) 
    fiscal_year = Column(String, nullable=False) 
    value = Column(Float, nullable=True)
    value_text = Column(String, nullable=True) 
    source = Column(String, nullable=True)
    platform = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
