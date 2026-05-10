import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models import Position, Signal, Notification
from app.models.position import Entry
from app.services.market import get_price_and_indicators
from app.services.analysis import calc_avg_cost, compute_signal
from app.services.email import send_signal_alert
from app.config import settings


def is_market_hours() -> bool:
    now = datetime.now(timezone.utc)
    if now.weekday() >= 5:
        return False
    return 8 <= now.hour <= 21


async def get_last_signal(db, position_id: uuid.UUID) -> Signal | None:
    result = await db.execute(
        select(Signal)
        .where(Signal.position_id == position_id)
        .order_by(Signal.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def save_signal_if_changed(db, position: Position, signal_data: dict, price: float) -> bool:
    last = await get_last_signal(db, position.id)
    if last and last.signal == signal_data["signal"]:
        return False

    sig = Signal(
        position_id=position.id,
        signal=signal_data["signal"],
        price=price,
        rsi=signal_data.get("rsi"),
        above_ma50=signal_data.get("above_ma50"),
        above_ma200=signal_data.get("above_ma200"),
        reason=signal_data.get("reason"),
    )
    db.add(sig)
    return True


async def notify_if_changed(
    db,
    position: Position,
    signal_data: dict,
    market_data: dict,
    changed: bool,
) -> None:
    if not changed:
        return

    avg_cost = calc_avg_cost(position.entries)
    price = market_data["price"]
    pnl_pct = ((price - avg_cost) / avg_cost * 100) if avg_cost else None
    signal = signal_data["signal"]
    reason = signal_data.get("reason", "")

    notif_type = "SIGNAL_CHANGE"
    if "Stop loss" in reason:
        notif_type = "STOP_LOSS"
    elif "Objectif" in reason:
        notif_type = "TAKE_PROFIT"

    notif = Notification(
        position_id=position.id,
        type=notif_type,
        message=f"{position.ticker} → {signal} : {reason}",
    )
    db.add(notif)

    if position.email_alerts:
        last_signals = await db.execute(
            select(Signal)
            .where(Signal.position_id == position.id)
            .order_by(Signal.created_at.desc())
            .limit(2)
        )
        sigs = last_signals.scalars().all()
        old_signal = sigs[1].signal if len(sigs) >= 2 else "—"
        send_signal_alert(
            ticker=position.ticker,
            old_signal=old_signal,
            new_signal=signal,
            price=price,
            avg_cost=avg_cost,
            pnl_pct=pnl_pct,
            reason=reason,
            currency=market_data.get("currency", "USD"),
        )


async def refresh_prices_loop(broadcast_fn) -> None:
    interval = settings.price_refresh_interval
    while True:
        try:
            if is_market_hours():
                async with AsyncSessionLocal() as db:
                    result = await db.execute(
                        select(Position).options(selectinload(Position.entries))
                    )
                    positions = result.scalars().all()
                    updates = []

                    for pos in positions:
                        data = get_price_and_indicators(pos.ticker)
                        if data is None:
                            continue

                        avg_cost = calc_avg_cost(pos.entries)
                        signal = compute_signal(
                            data["price"], avg_cost,
                            pos.stop_loss_pct, pos.take_profit_pct,
                            data.get("rsi"), data.get("above_ma50"), data.get("above_ma200"),
                            rsi_buy_threshold=pos.rsi_buy_threshold,
                            rsi_sell_threshold=pos.rsi_sell_threshold,
                        )

                        changed = await save_signal_if_changed(db, pos, signal, data["price"])
                        await notify_if_changed(db, pos, signal, data, changed)
                        await db.commit()

                        avg = avg_cost or 0
                        total_qty = sum(e.quantity for e in pos.entries)
                        total_invested = sum(e.quantity * e.price for e in pos.entries)
                        value = data["price"] * total_qty
                        pnl = value - total_invested

                        updates.append({
                            "id": str(pos.id),
                            **{k: v for k, v in data.items() if k != "history"},
                            "signal": signal["signal"],
                            "reason": signal["reason"],
                            "avg_cost": avg,
                            "total_qty": total_qty,
                            "total_invested": total_invested,
                            "value": value,
                            "pnl": pnl,
                            "pnl_pct": ((value - total_invested) / total_invested * 100) if total_invested else 0,
                        })

                        await asyncio.sleep(1)

                    if updates:
                        await broadcast_fn({"type": "prices_update", "data": updates})
        except Exception:
            pass

        await asyncio.sleep(interval)
