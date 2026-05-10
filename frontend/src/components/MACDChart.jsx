import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function MACDChart({ data }) {
  const macdData = data?.filter((d) => d.macd != null) ?? [];
  if (macdData.length === 0) return null;

  const formatted = macdData.map((d) => ({
    date: d.date?.slice(0, 10) ?? "",
    macd: d.macd,
    macd_signal: d.macd_signal,
    macd_hist: d.macd_hist,
  }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="font-semibold mb-4 text-sm text-gray-300">MACD (12/26/9)</h3>
      <ResponsiveContainer width="100%" height={180}>
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
            tickFormatter={(v) => v.toFixed(2)}
            width={50}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
            labelStyle={{ color: "#9ca3af", fontSize: 11 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(v) => v?.toFixed(4)}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#374151" />
          <Bar dataKey="macd_hist" name="Histogramme" maxBarSize={4}>
            {formatted.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.macd_hist >= 0 ? "#00d4a1" : "#ff4757"}
              />
            ))}
          </Bar>
          <Line type="monotone" dataKey="macd" stroke="#60a5fa" dot={false} strokeWidth={1.5} name="MACD" />
          <Line type="monotone" dataKey="macd_signal" stroke="#f5a623" dot={false} strokeWidth={1} strokeDasharray="4 2" name="Signal" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
