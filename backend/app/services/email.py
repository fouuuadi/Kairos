import resend
from app.config import settings

SIGNAL_COLORS = {
    "BUY": "#00d4a1",
    "HOLD": "#f5a623",
    "SELL": "#ff4757",
}


def send_signal_alert(
    ticker: str,
    old_signal: str,
    new_signal: str,
    price: float,
    avg_cost: float | None,
    pnl_pct: float | None,
    reason: str,
    currency: str = "EUR",
) -> None:
    if not settings.resend_api_key or settings.resend_api_key.startswith("re_xxx"):
        return

    resend.api_key = settings.resend_api_key
    color = SIGNAL_COLORS.get(new_signal, "#ffffff")
    avg_str = f"{avg_cost:.2f} {currency}" if avg_cost else "N/A"
    pnl_str = f"{pnl_pct:+.1f}%" if pnl_pct is not None else "N/A"

    html = f"""
    <div style="background:#1a1a2e;color:#e0e0e0;font-family:sans-serif;padding:32px;border-radius:12px;max-width:480px">
      <h2 style="color:{color};margin:0 0 16px">{ticker} — {new_signal}</h2>
      <p style="margin:0 0 8px">Signal : <b style="color:#aaa">{old_signal}</b> → <b style="color:{color}">{new_signal}</b></p>
      <p style="margin:0 0 8px">Prix actuel : <b>{price:.2f} {currency}</b></p>
      <p style="margin:0 0 8px">Prix moyen : <b>{avg_str}</b></p>
      <p style="margin:0 0 8px">P&L : <b style="color:{color}">{pnl_str}</b></p>
      <p style="margin:24px 0 0;color:#888;font-size:13px">{reason}</p>
    </div>
    """

    resend.Emails.send({
        "from": "Kairos <alerts@resend.dev>",
        "to": [settings.alert_email],
        "subject": f"[Kairos] {ticker} — Signal {new_signal}",
        "html": html,
    })
