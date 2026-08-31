import { AlertTriangle, AlertCircle, Info } from "lucide-react";

const CONFIG = {
  high:   { cls: "impact-high",   icon: AlertTriangle, label: "High Impact" },
  medium: { cls: "impact-medium", icon: AlertCircle,   label: "Medium"      },
  low:    { cls: "impact-low",    icon: Info,           label: "Low"         },
};

export default function WeaknessList({ weaknesses }) {
  if (!weaknesses?.length) return null;

  // Sort: high → medium → low
  const ORDER = { high: 0, medium: 1, low: 2 };
  const sorted = [...weaknesses].sort((a, b) => ORDER[a.impact] - ORDER[b.impact]);

  return (
    <div className="card">
      <div className="label mb-4">⚠️ Detected Weaknesses</div>
      <div className="space-y-3">
        {sorted.map((w, i) => {
          const { cls, icon: Icon, label } = CONFIG[w.impact] || CONFIG.low;
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]
                         animate-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Icon size={15} className={`mt-0.5 shrink-0 ${cls.includes("red") ? "text-red-400" : cls.includes("amber") ? "text-amber-400" : "text-emerald-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm leading-relaxed">{w.issue}</p>
              </div>
              <span className={`shrink-0 text-xs font-display font-semibold px-2.5 py-1 rounded-full ${cls}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
