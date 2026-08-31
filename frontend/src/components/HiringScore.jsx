/**
 * Animated hiring probability gauge.
 * score: 0–100
 */
export default function HiringScore({ score }) {
  if (score == null) return null;

  const pct      = Math.min(Math.max(score, 0), 100);
  const radius   = 54;
  const circ     = Math.PI * radius; // half circle
  const dash     = (pct / 100) * circ;

  const getColor = (s) => {
    if (s >= 70) return { stroke: "#34d399", label: "Strong Hire",   cls: "text-emerald-400" };
    if (s >= 45) return { stroke: "#fbbf24", label: "Borderline",    cls: "text-amber-400"   };
    return              { stroke: "#f87171", label: "Needs Work",     cls: "text-red-400"     };
  };

  const { stroke, label, cls } = getColor(pct);

  return (
    <div className="card flex flex-col items-center gap-2">
      <div className="label mb-1">🏆 Hiring Probability</div>

      {/* Half-circle gauge */}
      <div className="relative w-44 h-24 overflow-hidden">
        <svg width="176" height="100" viewBox="0 0 176 100">
          {/* Background arc */}
          <path
            d="M 12 88 A 76 76 0 0 1 164 88"
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 12 88 A 76 76 0 0 1 164 88"
            fill="none" stroke={stroke} strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 239.5} 239.5`}
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute bottom-0 inset-x-0 flex flex-col items-center">
          <span className={`font-display font-bold text-3xl ${cls}`}>{Math.round(pct)}%</span>
        </div>
      </div>

      <span className={`text-sm font-display font-semibold px-4 py-1.5 rounded-full mt-1
        ${pct >= 70 ? "bg-emerald-500/15 text-emerald-400" :
          pct >= 45 ? "bg-amber-500/15 text-amber-400" :
                      "bg-red-500/15 text-red-400"}`}>
        {label}
      </span>
    </div>
  );
}
