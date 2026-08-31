/**
 * Circular score ring card.
 * score: 0–10, color: tailwind color name
 */
export default function ScoreCard({ label, score, color = "brand", icon }) {
  const pct    = (score / 10) * 100;
  const radius = 28;
  const circ   = 2 * Math.PI * radius;
  const dash   = (pct / 100) * circ;

  const colorMap = {
    brand:   { stroke: "#4f6ef7", text: "text-brand-400",   bg: "bg-brand-500/10"   },
    emerald: { stroke: "#34d399", text: "text-emerald-400", bg: "bg-emerald-500/10" },
    violet:  { stroke: "#a78bfa", text: "text-violet-400",  bg: "bg-violet-500/10"  },
    amber:   { stroke: "#fbbf24", text: "text-amber-400",   bg: "bg-amber-500/10"   },
  };

  const { stroke, text, bg } = colorMap[color] || colorMap.brand;

  return (
    <div className="card flex flex-col items-center gap-4 animate-slide-up">
      {/* SVG ring */}
      <div className={`relative w-20 h-20 rounded-full ${bg} flex items-center justify-center`}>
        <svg width="80" height="80" className="-rotate-90 absolute inset-0">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r={radius} fill="none"
            stroke={stroke} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <span className={`font-display font-bold text-xl ${text} z-10`}>
          {score?.toFixed(1) ?? "—"}
        </span>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className="label mb-0.5">{label}</div>
        {icon && <div className="text-slate-500 text-xs">{icon}</div>}
      </div>
    </div>
  );
}
