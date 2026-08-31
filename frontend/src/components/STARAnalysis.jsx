import { CheckCircle2, XCircle } from "lucide-react";

const STAR_META = {
  situation: { label: "Situation",  desc: "Provided context & background",      letter: "S" },
  task:      { label: "Task",       desc: "Defined the goal or challenge",       letter: "T" },
  action:    { label: "Action",     desc: "Explained specific steps taken",      letter: "A" },
  result:    { label: "Result",     desc: "Quantified outcome / impact",         letter: "R" },
};

export default function STARAnalysis({ star }) {
  if (!star) return null;

  const present = Object.values(star).filter(Boolean).length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div className="label">🎯 STAR Method Coverage</div>
        <span className={`text-sm font-display font-semibold px-3 py-1 rounded-full
          ${present === 4 ? "bg-emerald-500/15 text-emerald-400" :
            present >= 2  ? "bg-amber-500/15 text-amber-400" :
                            "bg-red-500/15 text-red-400"}`}>
          {present}/4 components
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(STAR_META).map(([key, { label, desc, letter }]) => {
          const detected = star[key];
          return (
            <div
              key={key}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors
                ${detected ? "star-active" : "star-inactive"}`}
            >
              {/* Letter badge */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0
                ${detected ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-slate-600"}`}>
                {letter}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-sm font-semibold ${detected ? "text-slate-200" : "text-slate-500"}`}>
                    {label}
                  </span>
                  {detected
                    ? <CheckCircle2 size={13} className="text-brand-400 shrink-0" />
                    : <XCircle size={13} className="text-slate-600 shrink-0" />
                  }
                </div>
                <p className={`text-xs leading-relaxed ${detected ? "text-slate-400" : "text-slate-600"}`}>
                  {desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
