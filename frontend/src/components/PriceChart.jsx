import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function PriceChart({ data }) {
  if (!data || data.length === 0) return null;

  const formatted = data.map((d) => ({
    ...d,
    date: d.date?.slice(0, 10) ?? "",
  }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="font-semibold mb-4 text-sm text-gray-300">Prix — MA50 — MA200</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={formatted} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickFormatter={(v) => v.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b7280" }}
            domain={["auto", "auto"]}
            tickFormatter={(v) => v.toFixed(0)}
            width={55}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
            labelStyle={{ color: "#9ca3af", fontSize: 11 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(v) => v?.toFixed(2)}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="close" stroke="#60a5fa" dot={false} strokeWidth={1.5} name="Prix" />
          <Line type="monotone" dataKey="ma50" stroke="#f5a623" dot={false} strokeWidth={1} strokeDasharray="4 2" name="MA50" />
          <Line type="monotone" dataKey="ma200" stroke="#a78bfa" dot={false} strokeWidth={1} strokeDasharray="4 2" name="MA200" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
