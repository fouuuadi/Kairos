import yfinance as yf
import pandas as pd
import pandas_ta as ta


def get_price_and_indicators(ticker: str) -> dict | None:
    try:
        stock = yf.Ticker(ticker)
        info = stock.fast_info
        hist = stock.history(period="1y")

        if hist.empty or info.last_price is None:
            return None

        hist.ta.rsi(length=14, append=True)
        hist.ta.sma(length=50, append=True)
        hist.ta.sma(length=200, append=True)
        hist.ta.macd(append=True)

        last = hist.iloc[-1]
        current_price = float(info.last_price)
        prev_close = float(info.previous_close) if info.previous_close else current_price
        change_pct = ((current_price - prev_close) / prev_close) * 100 if prev_close else 0.0

        rsi_val = last.get("RSI_14")
        ma50_val = last.get("SMA_50")
        ma200_val = last.get("SMA_200")
        macd_val = last.get("MACD_12_26_9")
        macd_signal_val = last.get("MACDs_12_26_9")
        macd_hist_val = last.get("MACDh_12_26_9")
        close_val = float(last["Close"])

        history_cols = [
            c for c in ["Close", "SMA_50", "SMA_200", "RSI_14", "MACD_12_26_9", "MACDs_12_26_9", "MACDh_12_26_9"]
            if c in hist.columns
        ]
        history = (
            hist[history_cols]
            .dropna(subset=["Close"])
            .reset_index()
            .rename(columns={
                "Date": "date",
                "Close": "close",
                "SMA_50": "ma50",
                "SMA_200": "ma200",
                "RSI_14": "rsi",
                "MACD_12_26_9": "macd",
                "MACDs_12_26_9": "macd_signal",
                "MACDh_12_26_9": "macd_hist",
            })
        )
        history["date"] = history["date"].dt.strftime("%Y-%m-%d")

        return {
            "price": current_price,
            "change_pct": round(change_pct, 2),
            "currency": info.currency or "USD",
            "rsi": float(rsi_val) if pd.notna(rsi_val) else None,
            "ma50": float(ma50_val) if pd.notna(ma50_val) else None,
            "ma200": float(ma200_val) if pd.notna(ma200_val) else None,
            "above_ma50": bool(close_val > float(ma50_val)) if pd.notna(ma50_val) else None,
            "above_ma200": bool(close_val > float(ma200_val)) if pd.notna(ma200_val) else None,
            "macd": float(macd_val) if pd.notna(macd_val) else None,
            "macd_signal": float(macd_signal_val) if pd.notna(macd_signal_val) else None,
            "macd_hist": float(macd_hist_val) if pd.notna(macd_hist_val) else None,
            "history": history.to_dict(orient="records"),
        }
    except Exception:
        return None


def get_ticker_name(ticker: str) -> str | None:
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        return info.get("longName") or info.get("shortName")
    except Exception:
        return None
