import uuid
from datetime import datetime, date
from pydantic import BaseModel


class EntryCreate(BaseModel):
    date: date
    quantity: float
    price: float


class EntryOut(BaseModel):
    id: uuid.UUID
    position_id: uuid.UUID
    date: date
    quantity: float
    price: float
    created_at: datetime

    model_config = {"from_attributes": True}


class PositionCreate(BaseModel):
    ticker: str
    name: str
    stop_loss_pct: float = 15.0
    take_profit_pct: float = 30.0
    email_alerts: bool = True
    entries: list[EntryCreate] = []


class PositionUpdate(BaseModel):
    ticker: str | None = None
    name: str | None = None
    stop_loss_pct: float | None = None
    take_profit_pct: float | None = None
    email_alerts: bool | None = None


class PositionOut(BaseModel):
    id: uuid.UUID
    ticker: str
    name: str
    stop_loss_pct: float
    take_profit_pct: float
    email_alerts: bool
    created_at: datetime
    entries: list[EntryOut] = []

    model_config = {"from_attributes": True}
