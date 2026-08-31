import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const COLORS = ["#4f6ef7", "#6b8cff", "#a78bfa", "#34d399", "#fbbf24", "#f87171"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-600 border border-white/10 rounded-lg px-3 py-2 text-sm">
      <span className="text-slate-300">"{payload[0].payload.word}"</span>
      <span className="text-brand-400 font-semibold ml-2">{payload[0].value}×</span>
    </div>
  );
};

export default function FillerChart({ fillerWords }) {
  if (!fillerWords || Object.keys(fillerWords).length === 0) {
    return (
      <div className="card">
        <div className="label mb-4">Filler Word Analysis</div>
        <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
          ✨ No filler words detected — great job!
        </div>
      </div>
    );
  }

  const data = Object.entries(fillerWords)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div className="label">Filler Word Frequency</div>
        <span className="text-xs text-slate-500 font-mono">
          {Object.values(fillerWords).reduce((a, b) => a + b, 0)} total
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="35%">
          <XAxis
            dataKey="word"
            tick={{ fill: "#64748b", fontSize: 12, fontFamily: "DM Sans" }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false} tickLine={false}
            width={24}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
