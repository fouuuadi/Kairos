import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, Bell, RefreshCw, Plus } from "lucide-react";
import { cn, fmt, fmtPct } from "../lib/utils.js";

const MOCK_POSITIONS = [
  {
    id: "1", ticker: "AAPL", name: "Apple Inc.",
    signal: "HOLD", price: 189.30, change_pct: 0.54, currency: "USD",
    avg_cost: 162.40, total_qty: 5, total_invested: 812.00, value: 946.50,
    pnl: 134.50, pnl_pct: 16.57, rsi: 54.2, above_ma50: true, above_ma200: true,
  },
  {
    id: "2", ticker: "NVDA", name: "NVIDIA Corporation",
    signal: "SELL", price: 924.50, change_pct: 2.31, currency: "USD",
    avg_cost: 620.00, total_qty: 1.5, total_invested: 930.00, value: 1386.75,
    pnl: 456.75, pnl_pct: 49.11, rsi: 72.8, above_ma50: true, above_ma200: true,
  },
  {
    id: "3", ticker: "MSFT", name: "Microsoft Corporation",
    signal: "HOLD", price: 415.20, change_pct: -0.18, currency: "USD",
    avg_cost: 380.50, total_qty: 2, total_invested: 761.00, value: 830.40,
    pnl: 69.40, pnl_pct: 9.12, rsi: 52.1, above_ma50: true, above_ma200: true,
  },
  {
    id: "4", ticker: "AMZN", name: "Amazon.com Inc.",
    signal: "BUY", price: 178.40, change_pct: -3.20, currency: "USD",
    avg_cost: 195.00, total_qty: 4, total_invested: 780.00, value: 713.60,
    pnl: -66.40, pnl_pct: -8.51, rsi: 28.4, above_ma50: false, above_ma200: false,
  },
  {
    id: "5", ticker: "GOOGL", name: "Alphabet Inc.",
    signal: "HOLD", price: 172.60, change_pct: 1.05, currency: "USD",
    avg_cost: 155.20, total_qty: 3, total_invested: 465.60, value: 517.80,
    pnl: 52.20, pnl_pct: 11.21, rsi: 57.3, above_ma50: true, above_ma200: false,
  },
  {
    id: "6", ticker: "META", name: "Meta Platforms Inc.",
    signal: "BUY", price: 492.10, change_pct: -2.87, currency: "USD",
    avg_cost: 510.00, total_qty: 1, total_invested: 510.00, value: 492.10,
    pnl: -17.90, pnl_pct: -3.51, rsi: 29.1, above_ma50: false, above_ma200: true,
  },
];

const SIGNAL_BG = {
  BUY: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  HOLD: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  SELL: "bg-red-500/10 text-red-400 border border-red-500/30",
};

const SignalIcon = ({ signal }) => {
  if (signal === "BUY") return <TrendingUp size={13} />;
  if (signal === "SELL") return <TrendingDown size={13} />;
  return <Minus size={13} />;
};

function MockCard({ pos }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">{pos.ticker}</h3>
          <p className="text-gray-400 text-sm">{pos.name}</p>
        </div>
        <span className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full", SIGNAL_BG[pos.signal])}>
          <SignalIcon signal={pos.signal} />
          {pos.signal}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs mb-1">Prix actuel</p>
          <p className="font-medium">
            {fmt(pos.price)} {pos.currency}
            <span className={cn("ml-1 text-xs", pos.change_pct >= 0 ? "text-emerald-400" : "text-red-400")}>
              {fmtPct(pos.change_pct)}
            </span>
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Prix moyen</p>
          <p className="font-medium">{fmt(pos.avg_cost)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">P&L</p>
          <p className={cn("font-bold", pos.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
            +{fmt(pos.pnl)} <span className="text-xs font-normal">{fmtPct(pos.pnl_pct)}</span>
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">RSI</p>
          <p className={cn("font-medium", pos.rsi < 30 ? "text-emerald-400" : pos.rsi > 70 ? "text-red-400" : "")}>
            {fmt(pos.rsi, 1)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2 text-xs">
        <span className={cn("px-1.5 py-0.5 rounded", pos.above_ma50 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
          MA50 {pos.above_ma50 ? "↑" : "↓"}
        </span>
        <span className={cn("px-1.5 py-0.5 rounded", pos.above_ma200 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
          MA200 {pos.above_ma200 ? "↑" : "↓"}
        </span>
      </div>
    </div>
  );
}

export default function DemoDashboard() {
  const totalInvested = MOCK_POSITIONS.reduce((s, p) => s + p.total_invested, 0);
  const totalValue = MOCK_POSITIONS.reduce((s, p) => s + p.value, 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPct = (totalPnl / totalInvested) * 100;

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kairos</h1>
          <p className="text-gray-400 text-sm">DCA Portfolio Tracker</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-gray-800">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-sm">
            <RefreshCw size={14} /> Actualiser
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-sm font-medium">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </header>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 flex gap-12">
        <div>
          <p className="text-gray-400 text-sm mb-1">Valeur totale</p>
          <p className="text-3xl font-bold">{fmt(totalValue)} €</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">P&L total</p>
          <p className="text-3xl font-bold text-emerald-400">
            +{fmt(totalPnl)} €
            <span className="text-lg ml-2">{fmtPct(totalPnlPct)}</span>
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Investi</p>
          <p className="text-2xl font-medium text-gray-300">{fmt(totalInvested)} €</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_POSITIONS.map((pos) => (
          <MockCard key={pos.id} pos={pos} />
        ))}
      </div>
    </div>
  );
}
