from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class InviteCreate(BaseModel):
    email: EmailStr
    role: str 

class InviteResponse(BaseModel):
    email: str
    token: str
    role: str
    invite_url: str
    expires_at: datetime.datetime

class UserRegister(BaseModel):
    token: str
    password: str

class MetricValueBase(BaseModel):
    sheet: str
    category: str
    metric_name: str
    brand: str
    market: str
    channel: str
    period: str
    fiscal_year: str
    value: Optional[float] = None
    value_text: Optional[str] = None
    source: Optional[str] = None
    platform: Optional[str] = None

    class Config:
        from_attributes = True

class KPIItem(BaseModel):
    value: float
    unit: str
    change_text: str
    source: str
    description: str

class DashboardKPIs(BaseModel):
    toma: KPIItem
    consideration: KPIItem
    share_of_search: KPIItem
    mmr_reach: KPIItem
    tv_sov: KPIItem
    digital_sov: KPIItem
    paid_search_sos: KPIItem
    ai_sos: KPIItem
