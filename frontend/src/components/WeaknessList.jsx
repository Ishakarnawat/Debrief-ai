import { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowRight,
  Eye,
  Wrench,
  Quote,
} from "lucide-react";

const IMPACT_CONFIG = {
  high: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-500",
    label: "High Priority Fix",
    icon: AlertTriangle,
  },
  medium: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-500",
    label: "Medium Priority",
    icon: AlertCircle,
  },
  low: {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-500",
    label: "Pro Polish Tip",
    icon: Sparkles,
  },
};

export default function WeaknessList({ weaknesses }) {
  if (!weaknesses?.length) return null;

  // Track expanded state for cards (first item expanded by default)
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const toggleExpand = (idx) => {
    setExpandedIndex((prev) => (prev === idx ? null : idx));
  };

  const handleCopyExample = (e, text, idx) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Sort: high → medium → low
  const ORDER = { high: 0, medium: 1, low: 2 };
  const sorted = [...weaknesses].sort((a, b) => {
    const aImp = a.impact || "medium";
    const bImp = b.impact || "medium";
    return (ORDER[aImp] ?? 1) - (ORDER[bImp] ?? 1);
  });

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Target size={16} className="text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Actionable Coaching & Growth Opportunities
            </h3>
            <p className="text-xs text-slate-400">
              Clear recruiter playbooks to turn identified blindspots into interview strengths
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-surface-800 border border-white/10 text-slate-300">
          {sorted.length} {sorted.length === 1 ? "Opportunity" : "Opportunities"}
        </span>
      </div>

      {/* List of Actionable Coaching Cards */}
      <div className="space-y-3">
        {sorted.map((item, idx) => {
          const impactKey = item.impact || "medium";
          const cfg = IMPACT_CONFIG[impactKey] || IMPACT_CONFIG.medium;
          const isExpanded = expandedIndex === idx;
          const hasCoachingData = Boolean(item.whyItMatters || item.howToFix || item.example);

          // Fallbacks if backend only provided issue string
          const category = item.category || (item.issue?.toLowerCase().includes("metric") ? "Impact & Metrics" : "STAR Delivery");
          const whyItMatters =
            item.whyItMatters ||
            "Hiring managers evaluate answers based on concrete technical depth and verifiable business outcomes.";
          const howToFix =
            item.howToFix ||
            "Structure your narrative using the STAR framework: highlight your specific diagnosis, technical action, and the resulting measurable outcome.";
          const example =
            item.example ||
            "Anchor your result with baseline numbers: 'Diagnosed latency spikes and engineered Redis caching, reducing p99 response time from 2.8s to 145ms.'";

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? "bg-surface-800/90 border-white/15 shadow-lg shadow-black/20"
                  : "bg-surface-800/40 border-white/5 hover:border-white/10 hover:bg-surface-800/60"
              }`}
            >
              {/* Header Toggle Row */}
              <button
                type="button"
                onClick={() => toggleExpand(idx)}
                className="w-full text-left p-3.5 flex items-start gap-3 cursor-pointer focus:outline-none"
              >
                <cfg.icon
                  size={16}
                  className={`mt-0.5 shrink-0 ${
                    impactKey === "high"
                      ? "text-rose-400"
                      : impactKey === "medium"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                      {category}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-100 leading-snug">
                    {item.issue}
                  </h4>
                </div>

                <div className="shrink-0 p-1 text-slate-400 hover:text-white transition-colors">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Detailed Expandable Coaching Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 space-y-3 text-xs border-t border-white/5 animate-fade-in">
                  {/* Why it Matters (Interviewer's Lens) */}
                  <div className="p-3 rounded-lg bg-surface-900/80 border border-white/5 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                      <Eye size={13} />
                      <span>Why Interviewers Flag This:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed pl-5">
                      {whyItMatters}
                    </p>
                  </div>

                  {/* How to Fix (Actionable Playbook) */}
                  <div className="p-3 rounded-lg bg-brand-500/5 border border-brand-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-brand-300 font-medium">
                      <Wrench size={13} />
                      <span>How to Fix (Action Step):</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed pl-5">
                      {howToFix}
                    </p>
                  </div>

                  {/* Concrete Model Phrasing / Formula */}
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                        <Quote size={13} />
                        <span>Try Phrasing Like This:</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyExample(e, example, idx)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-surface-900/60 border border-white/5 hover:border-emerald-500/30 transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check size={11} className="text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Copy Formula
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-slate-200 italic font-mono text-[11.5px] leading-relaxed pl-5 border-l-2 border-emerald-500/40">
                      "{example}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
