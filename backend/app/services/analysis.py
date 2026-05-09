def calc_avg_cost(entries: list) -> float | None:
    total_qty = sum(e.quantity for e in entries)
    if total_qty == 0:
        return None
    return sum(e.quantity * e.price for e in entries) / total_qty


def compute_signal(
    current_price: float,
    avg_cost: float | None,
    stop_loss_pct: float,
    take_profit_pct: float,
    rsi: float | None,
    above_ma50: bool | None,
    above_ma200: bool | None,
) -> dict:
    if avg_cost is not None:
        sl_price = avg_cost * (1 - stop_loss_pct / 100)
        tp_price = avg_cost * (1 + take_profit_pct / 100)

        if current_price <= sl_price:
            return {"signal": "SELL", "reason": f"Stop loss atteint ({stop_loss_pct}% sous PM)"}
        if current_price >= tp_price:
            return {"signal": "SELL", "reason": f"Objectif de gain atteint (+{take_profit_pct}%)"}

    if rsi is not None:
        if rsi < 30:
            return {"signal": "BUY", "reason": f"RSI en survente ({rsi:.1f})"}
        if rsi > 70:
            return {"signal": "SELL", "reason": f"RSI en surachat ({rsi:.1f})"}

    if above_ma50 and above_ma200:
        return {"signal": "HOLD", "reason": "Tendance haussière (> MA50 & MA200)"}
    if above_ma50 is False and above_ma200 is False:
        return {"signal": "SELL", "reason": "Tendance baissière (< MA50 & MA200)"}

    return {"signal": "HOLD", "reason": "Signal neutre"}
