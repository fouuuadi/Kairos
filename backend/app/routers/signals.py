import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.signal import Signal
from app.schemas.signal import SignalOut

router = APIRouter(prefix="/signals", tags=["signals"])


@router.get("/{position_id}", response_model=list[SignalOut])
async def get_signals(position_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Signal)
        .where(Signal.position_id == position_id)
        .order_by(Signal.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()
