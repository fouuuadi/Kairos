import uuid
from datetime import datetime
from pydantic import BaseModel


class SignalOut(BaseModel):
    id: uuid.UUID
    position_id: uuid.UUID
    signal: str
    price: float
    rsi: float | None
    above_ma50: bool | None
    above_ma200: bool | None
    reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: uuid.UUID
    position_id: uuid.UUID
    type: str
    message: str
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
