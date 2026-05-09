import pytest
from app.services.analysis import compute_signal, calc_avg_cost


class FakeEntry:
    def __init__(self, qty, price):
        self.quantity = qty
        self.price = price


def test_calc_avg_cost():
    entries = [FakeEntry(10, 100), FakeEntry(20, 200)]
    avg = calc_avg_cost(entries)
    assert avg == pytest.approx((10 * 100 + 20 * 200) / 30)


def test_calc_avg_cost_empty():
    assert calc_avg_cost([]) is None


def test_stop_loss_triggers():
    result = compute_signal(
        current_price=80.0, avg_cost=100.0,
        stop_loss_pct=15.0, take_profit_pct=30.0,
        rsi=50, above_ma50=True, above_ma200=True,
    )
    assert result["signal"] == "SELL"
    assert "Stop loss" in result["reason"]


def test_take_profit_triggers():
    result = compute_signal(
        current_price=135.0, avg_cost=100.0,
        stop_loss_pct=15.0, take_profit_pct=30.0,
        rsi=50, above_ma50=True, above_ma200=True,
    )
    assert result["signal"] == "SELL"
    assert "Objectif" in result["reason"]


def test_rsi_oversold():
    result = compute_signal(
        current_price=100.0, avg_cost=100.0,
        stop_loss_pct=15.0, take_profit_pct=30.0,
        rsi=25.0, above_ma50=True, above_ma200=True,
    )
    assert result["signal"] == "BUY"


def test_rsi_overbought():
    result = compute_signal(
        current_price=100.0, avg_cost=100.0,
        stop_loss_pct=15.0, take_profit_pct=30.0,
        rsi=75.0, above_ma50=True, above_ma200=True,
    )
    assert result["signal"] == "SELL"


def test_bullish_trend():
    result = compute_signal(
        current_price=100.0, avg_cost=100.0,
        stop_loss_pct=15.0, take_profit_pct=30.0,
        rsi=50.0, above_ma50=True, above_ma200=True,
    )
    assert result["signal"] == "HOLD"


def test_bearish_trend():
    result = compute_signal(
        current_price=100.0, avg_cost=100.0,
        stop_loss_pct=15.0, take_profit_pct=30.0,
        rsi=50.0, above_ma50=False, above_ma200=False,
    )
    assert result["signal"] == "SELL"


def test_neutral_signal():
    result = compute_signal(
        current_price=100.0, avg_cost=100.0,
        stop_loss_pct=15.0, take_profit_pct=30.0,
        rsi=50.0, above_ma50=True, above_ma200=False,
    )
    assert result["signal"] == "HOLD"
    assert result["reason"] == "Signal neutre"


def test_no_avg_cost_rsi_oversold():
    result = compute_signal(
        current_price=100.0, avg_cost=None,
        stop_loss_pct=15.0, take_profit_pct=30.0,
        rsi=25.0, above_ma50=True, above_ma200=True,
    )
    assert result["signal"] == "BUY"
