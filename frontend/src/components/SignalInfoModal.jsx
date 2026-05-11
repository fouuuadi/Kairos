import { X, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

const SIGNAL_INFO = {
  SELL: {
    icon: TrendingDown,
    color: "text-sell",
    bg: "bg-sell/10",
    title: "Signal VENTE",
    description: "Il est recommandé de sortir de cette position.",
    actions: [
      "✓ Prendre tes profits si objectif atteint",
      "✓ Arrêter le DCA temporairement",
      "✓ Vendre tout ou partie de la position",
    ],
  },
  BUY: {
    icon: TrendingUp,
    color: "text-buy",
    bg: "bg-buy/10",
    title: "Signal ACHAT",
    description: "Opportunité d'achat identifiée.",
    actions: [
      "✓ Bon moment pour renforcer ton DCA",
      "✓ Acheter ta dose habituelle",
      "✓ Profiter du prix attractif",
    ],
  },
  HOLD: {
    icon: Minus,
    color: "text-hold",
    bg: "bg-hold/10",
    title: "Signal MAINTIEN",
    description: "Garder la position sans action particulière.",
    actions: [
      "✓ Continue ton DCA normal si prévu",
      "✓ Garde la position actuelle",
      "✓ Pas d'action urgente nécessaire",
    ],
  },
};

export default function SignalInfoModal({ signal, reason, onClose }) {
  if (!signal || !SIGNAL_INFO[signal]) return null;

  const info = SIGNAL_INFO[signal];
  const Icon = info.icon;

  // Détection du type de raison
  const isStopLoss = reason?.includes("Stop loss");
  const isTakeProfit = reason?.includes("Objectif");
  const isRSI = reason?.includes("RSI");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`flex items-center gap-3 ${info.color}`}>
            <div className={`p-2 rounded-lg ${info.bg}`}>
              <Icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">{info.title}</h3>
              <p className="text-sm text-gray-400">{info.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Raison */}
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-300">
            <span className="font-medium text-white">Raison :</span> {reason || "Signal neutre"}
          </p>
        </div>

        {/* Contexte spécifique */}
        {(isStopLoss || isTakeProfit || isRSI) && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex gap-2">
              <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-200">
                {isStopLoss && "⚠️ Protection activée : ta perte maximale est atteinte. Sortir maintient la discipline DCA."}
                {isTakeProfit && "🎯 Objectif atteint ! Tu as réalisé le gain prévu. Sécurise tes profits."}
                {isRSI && reason.includes("survente") && "📉 RSI bas = actif potentiellement survendu. Opportunité d'achat à prix réduit."}
                {isRSI && reason.includes("surachat") && "📈 RSI élevé = actif potentiellement surévalué. Risque de correction à court terme."}
              </p>
            </div>
          </div>
        )}

        {/* Actions recommandées */}
        <div>
          <h4 className="font-medium mb-2 text-white">Actions recommandées :</h4>
          <ul className="space-y-2">
            {info.actions.map((action, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-gray-500">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Ceci est un outil d'aide à la décision, pas un conseil financier.
            <br />
            Tu décides au final de tes investissements.
          </p>
        </div>
      </div>
    </div>
  );
}
