import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

export default function RSIChart({ data }) {
  const rsiData = data?.filter((d) => d.rsi != null) ?? [];
  if (rsiData.length === 0) return null;

  const formatted = rsiData.map((d) => ({
    date: d.date?.slice(0, 10) ?? "",
    rsi: d.rsi,
  }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="font-semibold mb-4 text-sm text-gray-300">RSI (14)</h3>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={formatted} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickFormatter={(v) => v.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickFormatter={(v) => v.toFixed(0)}
            width={35}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
            labelStyle={{ color: "#9ca3af", fontSize: 11 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(v) => v?.toFixed(1)}
          />
          <ReferenceLine y={70} stroke="#ff4757" strokeDasharray="4 2" label={{ value: "70", fill: "#ff4757", fontSize: 10 }} />
          <ReferenceLine y={30} stroke="#00d4a1" strokeDasharray="4 2" label={{ value: "30", fill: "#00d4a1", fontSize: 10 }} />
          <Area
            type="monotone"
            dataKey="rsi"
            stroke="#60a5fa"
            fill="url(#rsiGrad)"
            strokeWidth={1.5}
            dot={false}
            name="RSI"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
