import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Download, Upload, Info } from "lucide-react";
import { positionsApi, signalsApi } from "../api/client.js";
import PriceChart from "./PriceChart.jsx";
import RSIChart from "./RSIChart.jsx";
import MACDChart from "./MACDChart.jsx";
import SignalInfoModal from "./SignalInfoModal.jsx";
import { calcAvgCost, fmt, fmtPct, SIGNAL_BG, cn } from "../lib/utils.js";

export default function PositionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [entryForm, setEntryForm] = useState({ date: "", quantity: "", price: "" });
  const [showMacd, setShowMacd] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const importRef = useRef(null);

  const { data: position, isLoading } = useQuery({
    queryKey: ["position", id],
    queryFn: () => positionsApi.get(id),
  });

  const { data: market } = useQuery({
    queryKey: ["market", id],
    queryFn: () => positionsApi.market(id),
    staleTime: 60_000,
  });

  const { data: signals = [] } = useQuery({
    queryKey: ["signals", id],
    queryFn: () => signalsApi.list(id),
    staleTime: 60_000,
  });

  const updatePos = useMutation({
    mutationFn: (data) => positionsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["position", id] }),
  });

  const addEntry = useMutation({
    mutationFn: (entry) => positionsApi.addEntry(id, entry),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["position", id] });
      qc.invalidateQueries({ queryKey: ["positions"] });
      setShowAddEntry(false);
      setEntryForm({ date: "", quantity: "", price: "" });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: (entryId) => positionsApi.deleteEntry(id, entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["position", id] });
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });

  const deletePos = useMutation({
    mutationFn: () => positionsApi.delete(id),
    onSuccess: () => navigate("/"),
  });

  const importCsv = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return positionsApi.importCsv(id, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["position", id] });
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });

  if (isLoading) return <div className="flex justify-center py-20 text-gray-500">Chargement...</div>;
  if (!position) return null;

  const entries = position.entries || [];
  const avgCost = calcAvgCost(entries);
  const totalQty = entries.reduce((s, e) => s + e.quantity, 0);
  const totalInvested = entries.reduce((s, e) => s + e.quantity * e.price, 0);
  const price = market?.price ?? null;
  const value = price != null ? price * totalQty : null;
  const pnl = value != null ? value - totalInvested : null;
  const pnlPct = totalInvested > 0 && pnl != null ? (pnl / totalInvested) * 100 : null;
  const slPrice = avgCost != null ? avgCost * (1 - position.stop_loss_pct / 100) : null;
  const tpPrice = avgCost != null ? avgCost * (1 + position.take_profit_pct / 100) : null;

  const liveFromPositions = qc.getQueryData(["positions"])?.find((p) => p.id === id)?.live;
  const currentSignal = liveFromPositions?.signal;
  const currentReason = liveFromPositions?.reason;

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm">
        <ArrowLeft size={16} />
        Retour
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{position.ticker}</h1>
          <p className="text-gray-400">{position.name}</p>
        </div>
        {currentSignal && (
          <div className="flex items-start gap-2">
            <div className={cn("text-center px-4 py-2 rounded-xl", SIGNAL_BG[currentSignal])}>
              <p className="text-xl font-bold">{currentSignal}</p>
              {currentReason && <p className="text-xs mt-1 opacity-80">{currentReason}</p>}
            </div>
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              title="Comprendre ce signal"
            >
              <Info size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Prix actuel", value: price != null ? `${fmt(price)} ${market?.currency ?? ""}` : "—" },
          { label: "Prix moyen", value: avgCost != null ? fmt(avgCost) : "—" },
          { label: "Investi", value: `${fmt(totalInvested)} €` },
          { label: "Valeur", value: value != null ? `${fmt(value)} €` : "—" },
        ].map(({ label, value: v }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            <p className="font-semibold">{v}</p>
          </div>
        ))}
      </div>

      {pnl != null && (
        <div className={cn("bg-gray-900 border rounded-xl p-4 mb-6 flex items-center gap-4", pnl >= 0 ? "border-buy/30" : "border-sell/30")}>
          <div>
            <p className="text-gray-400 text-xs mb-1">P&L</p>
            <p className={cn("text-2xl font-bold", pnl >= 0 ? "text-buy" : "text-sell")}>
              {pnl >= 0 ? "+" : ""}{fmt(pnl)} €
              <span className="text-base ml-2">{fmtPct(pnlPct)}</span>
            </p>
          </div>
          <div className="border-l border-gray-700 pl-4 flex gap-8">
            <div>
              <p className="text-gray-400 text-xs mb-1">Stop Loss</p>
              <p className="text-sell font-medium">{slPrice != null ? `${fmt(slPrice)} €` : "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Take Profit</p>
              <p className="text-buy font-medium">{tpPrice != null ? `${fmt(tpPrice)} €` : "—"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-6">
        <PriceChart
          data={market?.history}
          slPrice={slPrice}
          tpPrice={tpPrice}
          signals={signals}
        />
        <RSIChart data={market?.history} />
        <div className="flex justify-end">
          <button
            onClick={() => setShowMacd((v) => !v)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              showMacd ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            )}
          >
            MACD
          </button>
        </div>
        {showMacd && <MACDChart data={market?.history} />}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Historique DCA</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(positionsApi.exportCsvUrl(id), "_blank")}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
            >
              <Download size={12} />
              Export CSV
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
            >
              <Upload size={12} />
              Import CSV
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importCsv.mutate(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => setShowAddEntry(true)}
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>
        </div>

        {showAddEntry && (
          <div className="mb-4 p-4 bg-gray-800 rounded-xl">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date</label>
                <input
                  type="date"
                  value={entryForm.date}
                  onChange={(e) => setEntryForm((v) => ({ ...v, date: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Quantité</label>
                <input
                  type="number"
                  step="any"
                  value={entryForm.quantity}
                  onChange={(e) => setEntryForm((v) => ({ ...v, quantity: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Prix</label>
                <input
                  type="number"
                  step="any"
                  value={entryForm.price}
                  onChange={(e) => setEntryForm((v) => ({ ...v, price: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addEntry.mutate({ date: entryForm.date, quantity: parseFloat(entryForm.quantity), price: parseFloat(entryForm.price) })}
                disabled={!entryForm.date || !entryForm.quantity || !entryForm.price}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm transition-colors"
              >
                Confirmer
              </button>
              <button onClick={() => setShowAddEntry(false)} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-800">
                <th className="text-left pb-2">Date</th>
                <th className="text-right pb-2">Quantité</th>
                <th className="text-right pb-2">Prix achat</th>
                <th className="text-right pb-2">Investi</th>
                <th className="text-right pb-2">Valeur actuelle</th>
                <th className="text-right pb-2">P&L lot</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const lotValue = price != null ? e.quantity * price : null;
                const lotCost = e.quantity * e.price;
                const lotPnl = lotValue != null ? lotValue - lotCost : null;
                return (
                  <tr key={e.id} className="border-b border-gray-800/50 last:border-0">
                    <td className="py-2">{e.date}</td>
                    <td className="py-2 text-right">{e.quantity}</td>
                    <td className="py-2 text-right">{fmt(e.price)}</td>
                    <td className="py-2 text-right">{fmt(lotCost)}</td>
                    <td className="py-2 text-right">{lotValue != null ? fmt(lotValue) : "—"}</td>
                    <td className={cn("py-2 text-right font-medium", lotPnl != null && (lotPnl >= 0 ? "text-buy" : "text-sell"))}>
                      {lotPnl != null ? `${lotPnl >= 0 ? "+" : ""}${fmt(lotPnl)}` : "—"}
                    </td>
                    <td className="py-2 pl-2">
                      <button
                        onClick={() => deleteEntry.mutate(e.id)}
                        className="text-gray-600 hover:text-sell transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="font-semibold mb-4">Paramètres</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Stop Loss %</label>
            <input
              type="number"
              step="0.5"
              defaultValue={position.stop_loss_pct}
              onBlur={(e) => updatePos.mutate({ stop_loss_pct: parseFloat(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Take Profit %</label>
            <input
              type="number"
              step="0.5"
              defaultValue={position.take_profit_pct}
              onBlur={(e) => updatePos.mutate({ take_profit_pct: parseFloat(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">RSI Buy (seuil survente)</label>
            <input
              type="number"
              step="1"
              min="1"
              max="49"
              defaultValue={position.rsi_buy_threshold}
              onBlur={(e) => updatePos.mutate({ rsi_buy_threshold: parseFloat(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">RSI Sell (seuil surachat)</label>
            <input
              type="number"
              step="1"
              min="51"
              max="99"
              defaultValue={position.rsi_sell_threshold}
              onBlur={(e) => updatePos.mutate({ rsi_sell_threshold: parseFloat(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            defaultChecked={position.email_alerts}
            onChange={(e) => updatePos.mutate({ email_alerts: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Alertes email</span>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            if (confirm(`Supprimer ${position.ticker} ?`)) deletePos.mutate();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sell border border-sell/30 hover:bg-sell/10 rounded-lg text-sm transition-colors"
        >
          <Trash2 size={14} />
          Supprimer la position
        </button>
      </div>

      {showInfoModal && (
        <SignalInfoModal
          signal={currentSignal}
          reason={currentReason}
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </div>
  );
}
