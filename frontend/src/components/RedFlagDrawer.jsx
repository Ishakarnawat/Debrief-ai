import React from "react";
import {
  X,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  XCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Terminal,
  Clock,
  FileWarning,
} from "lucide-react";

export default function RedFlagDrawer({
  isOpen,
  onClose,
  candidateName,
  overallScore,
  concerns = [],
  missingSkills = [],
  sanitizationReport = null,
  suggestedQuestions = [],
  onPromoteToInterview,
}) {
  if (!isOpen) return null;

  const hasInjections = Boolean(
    sanitizationReport?.is_suspicious ||
    (sanitizationReport?.flagged_injections && sanitizationReport.flagged_injections.length > 0)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-surface-900 border-l border-white/[0.1] shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] bg-surface-850 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-display text-white">
                    Candidate Risk &amp; Red Flag Audit
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    Deficiency Audit
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Target Candidate: <strong className="text-slate-200">{candidateName || "Candidate"}</strong> &bull; Match: {overallScore}%
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Security & Adversarial Prompt Injection Defense Card */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                hasInjections
                  ? "bg-rose-500/10 border-rose-500/40"
                  : "bg-surface-800/60 border-white/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {hasInjections ? (
                    <ShieldAlert size={18} className="text-rose-400" />
                  ) : (
                    <ShieldCheck size={18} className="text-emerald-400" />
                  )}
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    GenAI Security &amp; Injection Defense
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    hasInjections
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold"
                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                  }`}
                >
                  {hasInjections ? "Attack Neutralized" : "Clean Payload"}
                </span>
              </div>

              {hasInjections ? (
                <div className="space-y-2 text-xs">
                  <p className="text-rose-300 font-medium">
                    Adversarial instructions were detected in this resume intended to manipulate scoring!
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Debrief.ai&rsquo;s multi-stage sanitizer stripped invisible unicode characters, isolated system overrides, and scored the candidate using strict deterministic schemas.
                  </p>
                  {sanitizationReport?.flagged_injections?.length > 0 && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950/80 border border-rose-500/20 font-mono text-[11px] text-rose-400 space-y-1">
                      <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
                        <Terminal size={12} /> Flagged Attack Strings:
                      </div>
                      {sanitizationReport.flagged_injections.map((inj, idx) => (
                        <div key={idx} className="truncate text-rose-300 font-mono">
                          &gt; &quot;{inj}&quot;
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-xs text-slate-300">
                  <p className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 size={14} /> Zero adversarial system prompts or overrides detected.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {sanitizationReport?.invisible_chars_removed || 0} zero-width unicode whitespace characters were sanitized from the raw document stream.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Missing Critical Skills Breakdown */}
            <div className="p-5 rounded-2xl bg-surface-800/60 border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="text-rose-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Missing Critical Qualifications ({missingSkills.length})
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Hard Requirements</span>
              </div>

              {missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1.5"
                    >
                      <X size={12} className="text-rose-400" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Candidate satisfies all critical job requirements.
                </div>
              )}
            </div>

            {/* 3. Qualitative Deficiencies & Experience Gaps */}
            <div className="p-5 rounded-2xl bg-surface-800/60 border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Candidate Deficiencies &amp; Gaps ({concerns.length})
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">GenAI Rubric</span>
              </div>

              {concerns.length > 0 ? (
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {concerns.map((concern, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-xl bg-surface-900/80 border border-white/[0.04] flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0 font-mono text-[11px]">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{concern}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No significant concerns or gaps identified.</p>
              )}
            </div>

            {/* 4. Probe Interview Questions To Test These Exact Red Flags */}
            <div className="p-5 rounded-2xl bg-brand-500/5 border border-brand-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle size={16} className="text-brand-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-300">
                    Recommended Technical Probe Questions
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-brand-400/80">Tailored by Gemini</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Use these automated questions in the live interview to directly evaluate whether the candidate can bridge their identified technical gaps:
              </p>

              {suggestedQuestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestedQuestions.map((q, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-surface-900/90 border border-white/[0.06] text-xs font-mono text-slate-200 leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="text-brand-400 font-bold shrink-0">Q{i + 1}:</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No tailored questions generated.</p>
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-5 border-t border-white/[0.08] bg-surface-850 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
            >
              Close Drawer
            </button>

            {onPromoteToInterview && (
              <button
                onClick={() => {
                  onClose();
                  onPromoteToInterview();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <span>Promote to AI Video Interview</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
