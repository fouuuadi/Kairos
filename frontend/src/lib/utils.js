import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function fmt(value, decimals = 2) {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function fmtPct(value) {
  if (value == null || isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${fmt(value, 1)}%`;
}

export function calcAvgCost(entries) {
  const totalQty = entries.reduce((s, e) => s + e.quantity, 0);
  if (totalQty === 0) return null;
  return entries.reduce((s, e) => s + e.quantity * e.price, 0) / totalQty;
}

export const SIGNAL_COLOR = {
  BUY: "text-buy",
  HOLD: "text-hold",
  SELL: "text-sell",
};

export const SIGNAL_BG = {
  BUY: "bg-buy/10 text-buy border border-buy/30",
  HOLD: "bg-hold/10 text-hold border border-hold/30",
  SELL: "bg-sell/10 text-sell border border-sell/30",
};
