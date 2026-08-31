import { Sparkles, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function ImprovedAnswer({ answer, followUp }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Improved answer */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-brand-400" />
            <div className="label">🔁 Improved Answer</div>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300
                       transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5"
          >
            {copied ? <><Check size={12} className="text-emerald-400" /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <div className="bg-surface-800 rounded-xl p-4 border border-white/[0.04]">
          <p className="text-slate-300 text-sm leading-relaxed">{answer}</p>
        </div>
      </div>

      {/* Follow-up question */}
      {followUp && (
        <div className="card border-l-2 border-l-brand-500/50">
          <div className="label mb-2">🤖 Likely Follow-up Question</div>
          <p className="text-slate-200 text-sm font-medium leading-relaxed">"{followUp}"</p>
          <p className="text-slate-600 text-xs mt-2">Prepare a structured STAR answer for this.</p>
        </div>
      )}
    </div>
  );
}
