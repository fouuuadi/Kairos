import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search } from "lucide-react";
import { positionsApi } from "../api/client.js";
import { calcAvgCost, fmt } from "../lib/utils.js";

const emptyEntry = () => ({ date: new Date().toISOString().slice(0, 10), quantity: "", price: "" });

export default function AddPositionForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [slPct, setSlPct] = useState(15);
  const [tpPct, setTpPct] = useState(30);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [entries, setEntries] = useState([emptyEntry()]);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const handleVerify = async () => {
    if (!ticker) return;
    setVerifying(true);
    setVerifyError("");
    try {
      const data = await positionsApi.verifyTicker(ticker.toUpperCase());
      setName(data.ticker);
    } catch {
      setVerifyError("Ticker introuvable");
    } finally {
      setVerifying(false);
    }
  };

  const createPos = useMutation({
    mutationFn: (data) => positionsApi.create(data),
    onSuccess: (pos) => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      navigate(`/position/${pos.id}`);
    },
  });

  const validEntries = entries.filter((e) => e.date && e.quantity && e.price);
  const fakeEntries = validEntries.map((e) => ({ quantity: parseFloat(e.quantity), price: parseFloat(e.price) }));
  const avgCost = calcAvgCost(fakeEntries);
  const totalInvested = fakeEntries.reduce((s, e) => s + e.quantity * e.price, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ticker || !name) return;
    createPos.mutate({
      ticker: ticker.toUpperCase(),
      name,
      stop_loss_pct: parseFloat(slPct),
      take_profit_pct: parseFloat(tpPct),
      email_alerts: emailAlerts,
      entries: validEntries.map((e) => ({
        date: e.date,
        quantity: parseFloat(e.quantity),
        price: parseFloat(e.price),
      })),
    });
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white mb-6 text-sm transition-colors">
        ← Retour
      </button>

      <h1 className="text-2xl font-bold mb-8">Nouvelle position</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Ticker</h3>
          <div className="flex gap-2">
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="ex: AAPL, SXR8.DE"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm uppercase placeholder:normal-case"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || !ticker}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-sm transition-colors"
            >
              <Search size={14} />
              {verifying ? "..." : "Vérifier"}
            </button>
          </div>
          {verifyError && <p className="text-sell text-xs mt-2">{verifyError}</p>}
          {name && (
            <div className="mt-3">
              <label className="text-xs text-gray-400 mb-1 block">Nom</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Niveaux de sortie</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Stop Loss %</label>
              <input
                type="number"
                step="0.5"
                value={slPct}
                onChange={(e) => setSlPct(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Take Profit %</label>
              <input
                type="number"
                step="0.5"
                value={tpPct}
                onChange={(e) => setTpPct(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Alertes email</span>
          </label>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Achats DCA</h3>
          <div className="space-y-2 mb-3">
            {entries.map((entry, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 items-center">
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) => setEntries((prev) => prev.map((r, j) => j === i ? { ...r, date: e.target.value } : r))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Quantité"
                  value={entry.quantity}
                  onChange={(e) => setEntries((prev) => prev.map((r, j) => j === i ? { ...r, quantity: e.target.value } : r))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Prix"
                    value={entry.price}
                    onChange={(e) => setEntries((prev) => prev.map((r, j) => j === i ? { ...r, price: e.target.value } : r))}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  />
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEntries((prev) => prev.filter((_, j) => j !== i))}
                      className="text-gray-600 hover:text-sell transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEntries((prev) => [...prev, emptyEntry()])}
            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus size={14} />
            Ajouter un achat
          </button>

          {avgCost != null && (
            <div className="mt-4 p-3 bg-gray-800 rounded-lg text-sm flex gap-8">
              <div>
                <p className="text-gray-400 text-xs">Prix moyen</p>
                <p className="font-semibold">{fmt(avgCost)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Total investi</p>
                <p className="font-semibold">{fmt(totalInvested)}</p>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!ticker || !name || createPos.isPending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-medium transition-colors"
        >
          {createPos.isPending ? "Création..." : "Créer la position"}
        </button>
      </form>
    </div>
  );
}
