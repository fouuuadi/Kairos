#!/usr/bin/env python3
"""
Import Trade Republic positions into Kairos.

Usage:
    cd dca-tracker
    python -m venv .venv_scripts && source .venv_scripts/bin/activate
    pip install pytr requests
    python scripts/import_tr.py

Le script gère l'auth interactive et envoie les données à Kairos.
"""

import asyncio
import json
import sys
import requests
from datetime import datetime

try:
    from pytr.api import TradeRepublicApi
except ImportError:
    print("Installe pytr : pip install pytr")
    sys.exit(1)

KAIROS_URL = "http://localhost:8001"

# Mapping ISIN → ticker yfinance (complète si besoin)
ISIN_TO_TICKER = {
    "US5951121038": "MU",           # Micron Technology
    "US0404131064": "ANET",         # Arista Networks
    "NL0010273215": "ASML.AS",      # ASML
    "IE00B4L5Y983": "SXR8.DE",     # iShares Core S&P 500
    "IE00B579F325": "4GLD.DE",     # iShares Physical Gold
    "IE00BGV5VN51": "SEMS.DE",     # MSCI Semiconductors
}


async def fetch_portfolio(api: TradeRepublicApi) -> list[dict]:
    sub_id = await api.compact_portfolio()
    _, _, portfolio = await api.recv()

    positions = []
    items = portfolio.get("positions", [])

    for item in items:
        isin = item.get("instrumentId")
        if not isin:
            continue

        # Détails de l'instrument
        detail_id = await api.instrument_details(isin)
        _, _, details = await api.recv()

        name = details.get("shortName") or details.get("name") or isin
        ticker = ISIN_TO_TICKER.get(isin)

        if not ticker:
            # Essaye de deviner depuis les exchanges
            exchanges = details.get("exchanges", [])
            for ex in exchanges:
                if ex.get("exchangeId") in ("XETR", "XFRA"):
                    ticker = ex.get("slug", "").upper()
                    if ticker:
                        break
            if not ticker:
                ticker = details.get("homeSymbol") or isin

        positions.append({
            "isin": isin,
            "ticker": ticker,
            "name": name,
            "quantity": float(item.get("netSize", 0)),
            "avg_cost": float(item.get("averageBuyIn", 0)),
        })

    return positions


async def fetch_transactions(api: TradeRepublicApi, isin: str) -> list[dict]:
    entries = []
    after = None

    while True:
        sub_id = await api.timeline_transactions(after=after)
        _, _, data = await api.recv()

        items = data.get("items", [])
        if not items:
            break

        for item in items:
            body = item.get("eventBody", {}) or item
            ev_type = body.get("eventType", "") or item.get("type", "")

            if "buy" not in ev_type.lower() and "purchase" not in ev_type.lower():
                continue

            item_isin = (
                body.get("instrumentId")
                or body.get("isin")
                or item.get("instrumentId")
            )
            if item_isin != isin:
                continue

            try:
                date_str = body.get("timestamp") or item.get("timestamp", "")
                date = datetime.fromisoformat(date_str[:10]).date().isoformat()
                quantity = abs(float(body.get("shares", 0) or body.get("quantity", 0)))
                price = abs(float(body.get("price", 0)))

                if quantity > 0 and price > 0:
                    entries.append({"date": date, "quantity": quantity, "price": price})
            except Exception:
                continue

        after = data.get("cursors", {}).get("after")
        if not after:
            break

    return entries


async def main():
    print("=== Import Trade Republic → Kairos ===\n")

    phone = input("Numéro de téléphone (format: +33612345678) : ").strip()
    pin = input("PIN Trade Republic (4 chiffres) : ").strip()

    import os
    os.makedirs(os.path.expanduser("~/.pytr"), exist_ok=True)
    api = TradeRepublicApi(phone_no=phone, pin=pin, save_cookies=True)

    print("\nConnexion à Trade Republic...")
    loop = asyncio.get_event_loop()
    try:
        countdown = await loop.run_in_executor(None, api.initiate_weblogin)
        print(f"Code OTP envoyé. Tu as {countdown}s pour le saisir.")
    except Exception as e:
        print(f"Erreur lors de la connexion : {e}")
        sys.exit(1)

    otp = input("Code OTP reçu sur l'app TR : ").strip()

    try:
        await loop.run_in_executor(None, api.complete_weblogin, otp)
        print("Authentification réussie.\n")
    except Exception as e:
        print(f"Erreur OTP : {e}")
        sys.exit(1)

    print("Récupération du portfolio...")
    positions = await fetch_portfolio(api)

    if not positions:
        print("Aucune position trouvée.")
        sys.exit(0)

    print(f"\n{len(positions)} position(s) trouvée(s) :")
    for i, p in enumerate(positions):
        print(f"  {i+1}. {p['name']} ({p['ticker']}) — {p['quantity']} titres @ PM {p['avg_cost']:.2f} €")

    print("\nRécupération des transactions...")
    for pos in positions:
        print(f"  → {pos['ticker']}...", end=" ", flush=True)
        try:
            entries = await fetch_transactions(api, pos["isin"])
            pos["entries"] = entries
            print(f"{len(entries)} achat(s)")
        except Exception as e:
            pos["entries"] = []
            print(f"erreur ({e})")

    # Vérification : positions sans entries → créer une entry synthétique depuis avg_cost
    for pos in positions:
        if not pos["entries"] and pos["avg_cost"] > 0 and pos["quantity"] > 0:
            print(f"  ⚠ Pas de transactions pour {pos['ticker']}, entry synthétique créée (PM moyen)")
            pos["entries"] = [{
                "date": datetime.today().date().isoformat(),
                "quantity": pos["quantity"],
                "price": pos["avg_cost"],
            }]

    print("\nEnvoi vers Kairos...")
    created, skipped = 0, 0

    for pos in positions:
        payload = {
            "ticker": pos["ticker"],
            "name": pos["name"],
            "stop_loss_pct": 15.0,
            "take_profit_pct": 30.0,
            "email_alerts": True,
            "entries": pos["entries"],
        }
        try:
            r = requests.post(f"{KAIROS_URL}/positions/", json=payload, timeout=10)
            r.raise_for_status()
            print(f"  ✓ {pos['ticker']} importé")
            created += 1
        except requests.HTTPError as e:
            print(f"  ✗ {pos['ticker']} : {e}")
            skipped += 1

    print(f"\nTerminé — {created} importé(s), {skipped} échoué(s).")
    print(f"Ouvre http://localhost:5180 pour voir tes positions.")

    await api.close()


if __name__ == "__main__":
    asyncio.run(main())
