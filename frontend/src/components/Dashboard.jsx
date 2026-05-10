import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Plus, LayoutGrid, List } from "lucide-react";
import { positionsApi } from "../api/client.js";
import PositionCard from "./PositionCard.jsx";
import NotificationBell from "./NotificationBell.jsx";
import { calcAvgCost, fmt, fmtPct, cn } from "../lib/utils.js";

const SIGNAL_ORDER = { SELL: 0, BUY: 1, HOLD: 2 };

export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [sortBy, setSortBy] = useState("signal");
  const [compact, setCompact] = useState(false);

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: positionsApi.list,
  });

  const totalInvested = positions.reduce((sum, pos) => {
    return sum + pos.entries.reduce((s, e) => s + e.quantity * e.price, 0);
  }, 0);

  const totalValue = positions.reduce((sum, pos) => {
    const price = pos.live?.price;
    if (price == null) return sum;
    const qty = pos.entries.reduce((s, e) => s + e.quantity, 0);
    return sum + price * qty;
  }, 0);

  const totalPnl = totalValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  const sorted = useMemo(() => {
    const list = [...positions];
    if (sortBy === "signal") {
      list.sort((a, b) => {
        const sa = SIGNAL_ORDER[a.live?.signal ?? "HOLD"] ?? 2;
        const sb = SIGNAL_ORDER[b.live?.signal ?? "HOLD"] ?? 2;
        return sa - sb;
      });
    } else if (sortBy === "pnl") {
      list.sort((a, b) => {
        const pnlOf = (pos) => {
          const price = pos.live?.price;
          if (price == null) return -Infinity;
          const qty = pos.entries.reduce((s, e) => s + e.quantity, 0);
          const invested = pos.entries.reduce((s, e) => s + e.quantity * e.price, 0);
          return price * qty - invested;
        };
        return pnlOf(b) - pnlOf(a);
      });
    } else if (sortBy === "ticker") {
      list.sort((a, b) => a.ticker.localeCompare(b.ticker));
    }
    return list;
  }, [positions, sortBy]);

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kairos</h1>
          <p className="text-gray-400 text-sm">DCA Portfolio Tracker</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 cursor-pointer"
          >
            <option value="signal">Trier : Signal</option>
            <option value="pnl">Trier : P&L</option>
            <option value="ticker">Trier : Ticker</option>
          </select>
          <button
            onClick={() => setCompact((v) => !v)}
            title={compact ? "Vue détaillée" : "Vue compacte"}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
          >
            {compact ? <LayoutGrid size={16} /> : <List size={16} />}
          </button>
          <NotificationBell />
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["positions"] })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
          >
            <RefreshCw size={14} />
            Actualiser
          </button>
          <button
            onClick={() => navigate("/add")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium"
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>
      </header>

      {totalInvested > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 flex gap-12">
          <div>
            <p className="text-gray-400 text-sm mb-1">Valeur totale</p>
            <p className="text-3xl font-bold">{fmt(totalValue)} €</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">P&L total</p>
            <p className={cn("text-3xl font-bold", totalPnl >= 0 ? "text-buy" : "text-sell")}>
              {totalPnl >= 0 ? "+" : ""}{fmt(totalPnl)} €
              <span className="text-lg ml-2">{fmtPct(totalPnlPct)}</span>
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Investi</p>
            <p className="text-2xl font-medium text-gray-300">{fmt(totalInvested)} €</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20 text-gray-500">Chargement...</div>
      ) : positions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Aucune position. Commencez par en ajouter une.</p>
          <button
            onClick={() => navigate("/add")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            Ajouter une position
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((pos) => (
            <PositionCard key={pos.id} position={pos} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}
