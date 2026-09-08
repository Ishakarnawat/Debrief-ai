import { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Split,
  ListOrdered,
  HelpCircle,
  TrendingUp,
  CheckSquare,
  Square,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
} from "lucide-react";

export default function ImprovedAnswer({
  answer,
  improvedStar,
  transcript,
  actionPlan = [],
  coachingSummary,
  followUp,
}) {
  const [activeTab, setActiveTab] = useState("model"); // "model" | "compare" | "drills"
  const [copied, setCopied] = useState(false);
  const [copiedSection, setCopiedSection] = useState(null);
  const [checkedDrills, setCheckedDrills] = useState({});

  // Fallback STAR breakdown if not passed as an object
  const starData = improvedStar || {
    situation: "In my previous engineering project, our distributed services experienced severe p99 latency spikes of up to 2.8 seconds under peak concurrent traffic.",
    task: "My objective was to diagnose the root bottleneck and re-engineer our caching tier to guarantee sub-200ms latency under 5x load.",
    action: "I instrumented distributed tracing via OpenTelemetry, pinpointed redundant database queries, and implemented a multi-tiered Redis caching layer with proactive warming.",
    result: "This cut our p99 response times from 2.8s down to 145ms—a 95% latency reduction—while lowering database compute load by 40% and completely eliminating transaction timeouts.",
  };

  const defaultActionPlan = [
    "Anchor your story with the Metric Formula: explicitly state the baseline problem, your action, and the resulting percentage or dollar gain.",
    "Replace verbal filler words ('um', 'like', 'you know') with a deliberate 1-second pause to project confidence and authority.",
    "Dedicate 50% of your interview time to the 'Action' phase: focus clearly on what YOU personally diagnosed, built, and delivered.",
  ];

  const effectiveActionPlan = actionPlan?.length > 0 ? actionPlan : defaultActionPlan;

  const handleCopy = (text, key = null) => {
    navigator.clipboard.writeText(text);
    if (key) {
      setCopiedSection(key);
      setTimeout(() => setCopiedSection(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleDrill = (idx) => {
    setCheckedDrills((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const fullAnswerText =
    answer ||
    `${starData.situation} ${starData.task} ${starData.action} ${starData.result}`;

  return (
    <div className="space-y-4">
      {/* Executive Coaching Card */}
      <div className="card bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 border border-brand-500/20 shadow-xl overflow-hidden">
        {/* Top Header & Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                AI Executive Interview Coach
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  STAR Certified
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tailored model delivery, before vs. after comparison, and personalized drills
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 rounded-lg bg-surface-950 border border-white/5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("model")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "model"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers size={13} />
              Model Answer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("compare")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "compare"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Split size={13} />
              Before vs. After
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("drills")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "drills"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ListOrdered size={13} />
              Practice Drills
            </button>
          </div>
        </div>

        {/* Coaching Synthesis Summary */}
        {coachingSummary && (
          <div className="my-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-start gap-2.5">
            <TrendingUp size={16} className="text-brand-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-200 leading-relaxed">
              <strong className="text-brand-300 font-semibold block mb-0.5">Coach's Synthesis:</strong>
              {coachingSummary}
            </div>
          </div>
        )}

        {/* TAB 1: MODEL STAR ANSWER */}
        {activeTab === "model" && (
          <div className="space-y-4 pt-1 animate-fade-in">
            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <BookOpen size={13} className="text-brand-400" />
                Sentence-by-Sentence STAR Delivery Blueprint
              </span>
              <button
                type="button"
                onClick={() => handleCopy(fullAnswerText)}
                className="flex items-center gap-1.5 text-xs text-brand-300 hover:text-white transition-colors px-2.5 py-1 rounded-lg bg-surface-950 border border-white/10 hover:border-brand-500/40"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-400" /> Copied Full Story!
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy Full Script
                  </>
                )}
              </button>
            </div>

            {/* Structured STAR Cards */}
            <div className="space-y-2.5">
              {/* Situation */}
              <div className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/20 space-y-1.5 transition-colors hover:bg-sky-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    [S] Situation • Context & Baseline Pain
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(starData.situation, "situation")}
                    className="text-[11px] text-slate-400 hover:text-sky-300 transition-colors"
                  >
                    {copiedSection === "situation" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed pl-1">
                  {starData.situation}
                </p>
              </div>

              {/* Task */}
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1.5 transition-colors hover:bg-purple-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    [T] Task • Your Specific Responsibility & Goal
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(starData.task, "task")}
                    className="text-[11px] text-slate-400 hover:text-purple-300 transition-colors"
                  >
                    {copiedSection === "task" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed pl-1">
                  {starData.task}
                </p>
              </div>

              {/* Action */}
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5 transition-colors hover:bg-emerald-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    [A] Action • What YOU Personally Diagnosed & Built
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(starData.action, "action")}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 transition-colors"
                  >
                    {copiedSection === "action" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed pl-1">
                  {starData.action}
                </p>
              </div>

              {/* Result */}
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 transition-colors hover:bg-amber-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    [R] Result • Quantified Engineering & Business Impact
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(starData.result, "result")}
                    className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors"
                  >
                    {copiedSection === "result" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed pl-1">
                  {starData.result}
                </p>
              </div>
            </div>

            {/* Seamless Spoken Flow Card */}
            <div className="p-4 rounded-xl bg-surface-950 border border-white/5 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Full Spoken Narrative Flow:
              </span>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans">
                "{fullAnswerText}"
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: BEFORE VS. AFTER COMPARISON */}
        {activeTab === "compare" && (
          <div className="space-y-4 pt-1 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Column */}
              <div className="p-4 rounded-xl bg-surface-950 border border-rose-500/20 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Your Spoken Transcript
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    Needs Polish
                  </span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed italic">
                  "{transcript || "I worked on our system services when we had performance issues. We changed some database queries and tried to make it faster for users."}"
                </p>
                <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] text-slate-400">
                  <div className="text-rose-300 font-semibold">⚠️ Potential Panel Objections:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
                    <li>Lacks baseline problem numbers (e.g. latency, error rate).</li>
                    <li>Uses vague collective "we" instead of personal contribution.</li>
                    <li>No concrete post-launch business metrics or time saved.</li>
                  </ul>
                </div>
              </div>

              {/* After Column */}
              <div className="p-4 rounded-xl bg-surface-950 border border-emerald-500/30 space-y-2.5 shadow-lg shadow-emerald-950/10">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    AI Executive Benchmark
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Strong Hire Signal
                  </span>
                </div>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-medium">
                  "{fullAnswerText}"
                </p>
                <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] text-slate-400">
                  <div className="text-emerald-300 font-semibold">✓ Signals Proven:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
                    <li>Clear initial constraint (e.g. 2.8s p99 latency baseline).</li>
                    <li>Specific technical tools and diagnosis (OpenTelemetry, Redis).</li>
                    <li>Measurable outcome (95% latency reduction, zero timeouts).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRACTICE DRILLS */}
        {activeTab === "drills" && (
          <div className="space-y-3 pt-1 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
              <span>Complete these 3 verbal practice drills before your next round:</span>
              <span className="text-brand-400 font-mono font-semibold">
                {Object.values(checkedDrills).filter(Boolean).length} / {effectiveActionPlan.length} Done
              </span>
            </div>

            <div className="space-y-2.5">
              {effectiveActionPlan.map((drill, idx) => {
                const isChecked = Boolean(checkedDrills[idx]);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDrill(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isChecked
                        ? "bg-emerald-500/10 border-emerald-500/30 text-slate-300"
                        : "bg-surface-950 border-white/5 hover:border-white/15 text-slate-200"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 text-brand-400">
                      {isChecked ? (
                        <CheckSquare size={17} className="text-emerald-400" />
                      ) : (
                        <Square size={17} className="text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white mb-0.5">
                        Drill #{idx + 1}
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${
                          isChecked ? "line-through text-slate-400" : "text-slate-300"
                        }`}
                      >
                        {drill}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Strategic Coach Card */}
      {followUp && (
        <div className="card border-l-4 border-l-brand-500 bg-surface-900/90 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HelpCircle size={15} className="text-brand-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
                Strategic Interviewer Follow-Up Question
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
              High Probability
            </span>
          </div>

          <p className="text-white text-sm font-semibold leading-relaxed pl-1">
            "{followUp}"
          </p>

          <div className="mt-3 p-3 rounded-lg bg-surface-950 border border-white/5 space-y-1 text-xs">
            <div className="text-slate-400 font-medium">💡 Strategic Answering Roadmap:</div>
            <p className="text-slate-300 leading-relaxed pl-1">
              Do not give a simple one-line definition. Instead, describe your architectural trade-offs: what failure modes you considered (e.g. cache stampede, stale data), how you tested edge cases, and what monitoring alerts you put in place.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
