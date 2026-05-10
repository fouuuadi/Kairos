import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { calcAvgCost, fmt, fmtPct, SIGNAL_BG, cn } from "../lib/utils.js";

const SignalIcon = ({ signal }) => {
  if (signal === "BUY") return <TrendingUp size={14} />;
  if (signal === "SELL") return <TrendingDown size={14} />;
  return <Minus size={14} />;
};

export default function PositionCard({ position, compact = false }) {
  const navigate = useNavigate();
  const live = position.live;
  const entries = position.entries || [];

  const avgCost = calcAvgCost(entries);
  const totalQty = entries.reduce((s, e) => s + e.quantity, 0);
  const totalInvested = entries.reduce((s, e) => s + e.quantity * e.price, 0);
  const price = live?.price ?? null;
  const signal = live?.signal ?? null;
  const value = price != null ? price * totalQty : null;
  const pnl = value != null ? value - totalInvested : null;
  const pnlPct = totalInvested > 0 && pnl != null ? (pnl / totalInvested) * 100 : null;

  return (
    <div
      onClick={() => navigate(`/position/${position.id}`)}
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-gray-600 transition-all hover:shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">{position.ticker}</h3>
          {!compact && <p className="text-gray-400 text-sm">{position.name}</p>}
        </div>
        {signal && (
          <span className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full", SIGNAL_BG[signal])}>
            <SignalIcon signal={signal} />
            {signal}
          </span>
        )}
      </div>

      <div className={cn("grid gap-3 text-sm", compact ? "grid-cols-2" : "grid-cols-2")}>
        <div>
          <p className="text-gray-500 text-xs mb-1">Prix actuel</p>
          <p className="font-medium">
            {price != null ? `${fmt(price)} ${live?.currency ?? ""}` : "—"}
            {!compact && live?.change_pct != null && (
              <span className={cn("ml-1 text-xs", live.change_pct >= 0 ? "text-buy" : "text-sell")}>
                {fmtPct(live.change_pct)}
              </span>
            )}
          </p>
        </div>

        {!compact && (
          <div>
            <p className="text-gray-500 text-xs mb-1">Prix moyen</p>
            <p className="font-medium">{avgCost != null ? fmt(avgCost) : "—"}</p>
          </div>
        )}

        <div>
          <p className="text-gray-500 text-xs mb-1">P&L</p>
          <p className={cn("font-bold", pnl != null && (pnl >= 0 ? "text-buy" : "text-sell"))}>
            {pnl != null ? `${pnl >= 0 ? "+" : ""}${fmt(pnl)}` : "—"}
            {pnlPct != null && (
              <span className="text-xs font-normal ml-1">{fmtPct(pnlPct)}</span>
            )}
          </p>
        </div>

        {!compact && (
          <div>
            <p className="text-gray-500 text-xs mb-1">RSI</p>
            <p className={cn(
              "font-medium",
              live?.rsi != null && live.rsi < 30 ? "text-buy" : live?.rsi > 70 ? "text-sell" : ""
            )}>
              {live?.rsi != null ? fmt(live.rsi, 1) : "—"}
            </p>
          </div>
        )}
      </div>

      {!compact && live?.rsi != null && (
        <div className="mt-3 flex gap-2 text-xs">
          <span className={cn("px-1.5 py-0.5 rounded", live.above_ma50 ? "bg-buy/10 text-buy" : "bg-sell/10 text-sell")}>
            MA50 {live.above_ma50 ? "↑" : "↓"}
          </span>
          <span className={cn("px-1.5 py-0.5 rounded", live.above_ma200 ? "bg-buy/10 text-buy" : "bg-sell/10 text-sell")}>
            MA200 {live.above_ma200 ? "↑" : "↓"}
          </span>
        </div>
      )}
    </div>
  );
}
