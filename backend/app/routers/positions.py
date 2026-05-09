import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.position import Position, Entry
from app.schemas.position import PositionCreate, PositionOut, PositionUpdate, EntryCreate, EntryOut
from app.services.market import get_price_and_indicators

router = APIRouter(prefix="/positions", tags=["positions"])


async def _get_position_or_404(position_id: uuid.UUID, db: AsyncSession) -> Position:
    result = await db.execute(
        select(Position)
        .where(Position.id == position_id)
        .options(selectinload(Position.entries))
    )
    pos = result.scalar_one_or_none()
    if not pos:
        raise HTTPException(status_code=404, detail="Position not found")
    return pos


@router.get("/", response_model=list[PositionOut])
async def list_positions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Position).options(selectinload(Position.entries)).order_by(Position.created_at)
    )
    return result.scalars().all()


@router.post("/", response_model=PositionOut, status_code=201)
async def create_position(data: PositionCreate, db: AsyncSession = Depends(get_db)):
    position = Position(
        ticker=data.ticker.upper(),
        name=data.name,
        stop_loss_pct=data.stop_loss_pct,
        take_profit_pct=data.take_profit_pct,
        email_alerts=data.email_alerts,
    )
    db.add(position)
    await db.flush()

    for e in data.entries:
        entry = Entry(position_id=position.id, date=e.date, quantity=e.quantity, price=e.price)
        db.add(entry)

    await db.commit()
    await db.refresh(position)
    result = await db.execute(
        select(Position).where(Position.id == position.id).options(selectinload(Position.entries))
    )
    return result.scalar_one()


@router.get("/{position_id}", response_model=PositionOut)
async def get_position(position_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await _get_position_or_404(position_id, db)


@router.patch("/{position_id}", response_model=PositionOut)
async def update_position(position_id: uuid.UUID, data: PositionUpdate, db: AsyncSession = Depends(get_db)):
    pos = await _get_position_or_404(position_id, db)
    if data.ticker is not None:
        pos.ticker = data.ticker.upper()
    if data.name is not None:
        pos.name = data.name
    if data.stop_loss_pct is not None:
        pos.stop_loss_pct = data.stop_loss_pct
    if data.take_profit_pct is not None:
        pos.take_profit_pct = data.take_profit_pct
    if data.email_alerts is not None:
        pos.email_alerts = data.email_alerts
    await db.commit()
    await db.refresh(pos)
    return pos


@router.delete("/{position_id}", status_code=204)
async def delete_position(position_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    pos = await _get_position_or_404(position_id, db)
    await db.delete(pos)
    await db.commit()


@router.post("/{position_id}/entries", response_model=EntryOut, status_code=201)
async def add_entry(position_id: uuid.UUID, data: EntryCreate, db: AsyncSession = Depends(get_db)):
    await _get_position_or_404(position_id, db)
    entry = Entry(position_id=position_id, date=data.date, quantity=data.quantity, price=data.price)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{position_id}/entries/{entry_id}", status_code=204)
async def delete_entry(position_id: uuid.UUID, entry_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Entry).where(Entry.id == entry_id, Entry.position_id == position_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.commit()


@router.get("/{position_id}/market")
async def get_market_data(position_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    pos = await _get_position_or_404(position_id, db)
    return get_price_and_indicators(pos.ticker)


@router.get("/verify/{ticker}")
async def verify_ticker(ticker: str):
    data = get_price_and_indicators(ticker.upper())
    if data is None:
        raise HTTPException(status_code=404, detail="Ticker not found")
    return {"ticker": ticker.upper(), "price": data["price"], "currency": data["currency"]}
