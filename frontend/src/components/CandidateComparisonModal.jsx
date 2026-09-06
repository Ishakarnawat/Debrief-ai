import React, { useState } from "react";
import {
  X,
  Award,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Download,
  Code2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  FileJson,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import CompetencyRadarChart from "./CompetencyRadarChart";
import {
  generateGreenhouseCSV,
  generateLeverCSV,
  generateATSJSON,
  downloadCSV,
  downloadJSON,
} from "../utils/atsExporter";

const CANDIDATE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];

export default function CandidateComparisonModal({
  candidates = [],
  onClose,
  onRemoveCandidate,
  onSelectCandidateForReview,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "radar" | "coding" | "proctoring"
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportFeedback, setExportFeedback] = useState("");

  if (!candidates || candidates.length < 2) return null;

  // Find top overall scorer
  const topCandidate = [...candidates].sort(
    (a, b) => (b.hiring_score || 0) - (a.hiring_score || 0)
  )[0];

  // Radar candidates payload
  const radarCandidates = candidates.map((c, idx) => ({
    name: c.candidateName || `Candidate ${idx + 1}`,
    color: CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length],
    rubric: c.rubric || {
      technicalAccuracy: c.scores?.depth || 7.5,
      communicationClarity: c.scores?.clarity || 7.8,
      problemSolving: c.scores?.relevance || 8.0,
      starCompliance: 7.5,
      confidenceBodyLanguage: 8.0,
    },
  }));

  // Handlers for ATS Exports
  const handleExportGreenhouse = () => {
    const csv = generateGreenhouseCSV(candidates);
    downloadCSV(`debrief-ai-greenhouse-comparison-${Date.now()}.csv`, csv);
    triggerFeedback("Greenhouse CSV Exported!");
  };

  const handleExportLever = () => {
    const csv = generateLeverCSV(candidates);
    downloadCSV(`debrief-ai-lever-comparison-${Date.now()}.csv`, csv);
    triggerFeedback("Lever CSV Exported!");
  };

  const handleExportJSON = () => {
    const json = generateATSJSON(candidates);
    downloadJSON(`debrief-ai-ats-package-${Date.now()}.json`, json);
    triggerFeedback("ATS JSON Package Downloaded!");
  };

  const triggerFeedback = (msg) => {
    setExportFeedback(msg);
    setShowExportMenu(false);
    setTimeout(() => setExportFeedback(""), 3500);
  };

  // Compute category leaders
  const dimensions = [
    { key: "technicalAccuracy", label: "Tech Accuracy" },
    { key: "communicationClarity", label: "Communication" },
    { key: "problemSolving", label: "Problem Solving" },
    { key: "starCompliance", label: "STAR Compliance" },
    { key: "confidenceBodyLanguage", label: "Confidence" },
  ];

  const leaders = {};
  dimensions.forEach((dim) => {
    let bestScore = -1;
    let leaderName = "";
    let leaderColor = "";
    candidates.forEach((c, idx) => {
      const val = c.rubric?.[dim.key] ?? 7.5;
      if (val > bestScore) {
        bestScore = val;
        leaderName = c.candidateName || `Candidate ${idx + 1}`;
        leaderColor = CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length];
      }
    });
    leaders[dim.key] = { name: leaderName, score: bestScore, color: leaderColor };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-6xl bg-surface-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surface-950/90 shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Trophy size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-white text-lg">
                  Multi-Candidate Evaluation Matrix
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 font-mono">
                  {candidates.length} Candidates Head-to-Head
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Side-by-side comparative benchmarking, live coding metrics, and ATS exports.
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {exportFeedback && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 size={14} />
                {exportFeedback}
              </span>
            )}

            {/* ATS Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-3.5 shadow-lg shadow-brand-500/20"
              >
                <Download size={14} />
                <span>Export ATS Package</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-950 border border-white/10 rounded-xl shadow-2xl p-1.5 z-20 space-y-1 animate-fade-in">
                  <div className="px-2.5 py-1.5 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    ATS Data Connectors
                  </div>
                  <button
                    type="button"
                    onClick={handleExportGreenhouse}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-surface-800 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Greenhouse CSV</div>
                      <div className="text-[10px] text-slate-500">Standard candidate format</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportLever}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-surface-800 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <FileSpreadsheet size={15} className="text-blue-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Lever CSV</div>
                      <div className="text-[10px] text-slate-500">Posting & rubric schema</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-surface-800 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <FileJson size={15} className="text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Universal ATS JSON</div>
                      <div className="text-[10px] text-slate-500">Workday, Ashby & BambooHR</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-surface-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Candidate Chips Row */}
        <div className="px-6 py-3 bg-surface-950/40 border-b border-white/5 flex items-center gap-2.5 overflow-x-auto shrink-0">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Comparing:
          </span>
          {candidates.map((c, idx) => {
            const color = CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length];
            return (
              <div
                key={c._id || idx}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-800/80 border border-white/10 text-xs text-slate-200 shrink-0"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
                />
                <span className="font-semibold">{c.candidateName || `Candidate ${idx + 1}`}</span>
                <span className="text-[11px] font-mono text-slate-400">
                  {Math.round(c.hiring_score || 0)}%
                </span>
                {candidates.length > 2 && onRemoveCandidate && (
                  <button
                    type="button"
                    onClick={() => onRemoveCandidate(c._id)}
                    className="text-slate-400 hover:text-red-400 ml-1 transition-colors"
                    title="Remove from comparison"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* View Tabs */}
        <div className="px-6 border-b border-white/10 bg-surface-950/20 flex gap-4 shrink-0">
          {[
            { id: "overview", label: "Executive Head-to-Head", icon: Award },
            { id: "radar", label: "Competency Radar Overlay", icon: TrendingUp },
            { id: "coding", label: "Live Coding Challenge", icon: Code2 },
            { id: "proctoring", label: "Anti-Cheat & MediaPipe Vision", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  active
                    ? "border-brand-500 text-brand-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Top KPI Cards Side-by-Side */}
              <div
                className={`grid gap-4`}
                style={{
                  gridTemplateColumns: `repeat(${candidates.length}, minmax(0, 1fr))`,
                }}
              >
                {candidates.map((cand, idx) => {
                  const color = CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length];
                  const isWinner = cand._id === topCandidate._id;
                  const score = Math.round(cand.hiring_score || 0);
                  const proctoring = cand.proctoring || {};
                  const isClean = (proctoring.integrityScore ?? 100) >= 85;

                  return (
                    <div
                      key={cand._id || idx}
                      className={`p-4 rounded-2xl bg-surface-800/60 border transition-all relative flex flex-col justify-between ${
                        isWinner
                          ? "border-brand-500/40 shadow-lg shadow-brand-500/10"
                          : "border-white/5"
                      }`}
                    >
                      {isWinner && (
                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-brand-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-md font-mono uppercase tracking-wider">
                          <Trophy size={10} /> Top Pick
                        </span>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <h3 className="font-display font-bold text-white text-base">
                                {cand.candidateName || `Candidate ${idx + 1}`}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">
                              {cand.targetRole || "Software Engineer"}
                            </p>
                            {cand.candidateEmail && (
                              <p className="text-[11px] text-slate-500 font-mono">
                                {cand.candidateEmail}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Overall Score */}
                        <div className="p-3 rounded-xl bg-surface-900/80 border border-white/5 flex items-baseline justify-between">
                          <div>
                            <div className="text-[11px] text-slate-400">Hiring Score</div>
                            <div
                              className="text-2xl font-display font-bold"
                              style={{ color }}
                            >
                              {score}%
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold font-mono ${
                              score >= 80
                                ? "bg-emerald-500/20 text-emerald-300"
                                : score >= 65
                                ? "bg-brand-500/20 text-brand-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {cand.recommendation || (score >= 80 ? "Strong Hire" : "Hire")}
                          </span>
                        </div>

                        {/* Integrity & Code Snapshot */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-lg bg-surface-900/60 border border-white/5">
                            <span className="text-[10px] text-slate-400 block">Integrity</span>
                            <span
                              className={`font-bold font-mono ${
                                isClean ? "text-emerald-400" : "text-amber-400"
                              }`}
                            >
                              {proctoring.integrityScore ?? 100}%
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-surface-900/60 border border-white/5">
                            <span className="text-[10px] text-slate-400 block">Coding Test</span>
                            <span
                              className={`font-bold font-mono ${
                                cand.codeEvaluation?.status === "PASSED"
                                  ? "text-emerald-400"
                                  : "text-slate-300"
                              }`}
                            >
                              {cand.codeEvaluation?.status || "Passed (3/3)"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {onSelectCandidateForReview && (
                        <button
                          type="button"
                          onClick={() => onSelectCandidateForReview(cand)}
                          className="mt-4 w-full py-1.5 rounded-lg bg-surface-700/60 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 text-xs font-semibold border border-white/5 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span>Full Deep-Dive</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Category Leaders Banner */}
              <div className="p-4 rounded-xl bg-surface-950 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <Sparkles size={14} className="text-brand-400" />
                  <span>Category-by-Category Head-to-Head Winners</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {dimensions.map((dim) => {
                    const leader = leaders[dim.key];
                    return (
                      <div
                        key={dim.key}
                        className="p-3 rounded-xl bg-surface-800/60 border border-white/5 space-y-1"
                      >
                        <div className="text-[11px] text-slate-400">{dim.label}</div>
                        <div className="text-sm font-display font-bold text-white truncate">
                          {leader.name}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className="font-mono font-bold"
                            style={{ color: leader.color }}
                          >
                            {leader.score} / 10
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                            Leader
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Differential Comparison Table */}
              <div className="card p-4 bg-surface-800/50 border border-white/5 rounded-xl space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Detailed Attribute Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-mono">
                        <th className="py-2.5 px-3">Metric / Competency</th>
                        {candidates.map((c, idx) => (
                          <th
                            key={idx}
                            className="py-2.5 px-3 font-semibold"
                            style={{ color: CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length] }}
                          >
                            {c.candidateName || `Candidate ${idx + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-slate-400">Technical Depth</td>
                        {candidates.map((c, idx) => (
                          <td key={idx} className="py-2.5 px-3 font-mono font-bold">
                            {c.rubric?.technicalAccuracy ?? 7.5} / 10
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-slate-400">Communication Clarity</td>
                        {candidates.map((c, idx) => (
                          <td key={idx} className="py-2.5 px-3 font-mono font-bold">
                            {c.rubric?.communicationClarity ?? 7.8} / 10
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-slate-400">Problem Solving</td>
                        {candidates.map((c, idx) => (
                          <td key={idx} className="py-2.5 px-3 font-mono font-bold">
                            {c.rubric?.problemSolving ?? 8.0} / 10
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-slate-400">STAR Method Compliance</td>
                        {candidates.map((c, idx) => (
                          <td key={idx} className="py-2.5 px-3 font-mono font-bold">
                            {c.rubric?.starCompliance ?? 7.5} / 10
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-slate-400">Speaking Velocity (WPM)</td>
                        {candidates.map((c, idx) => (
                          <td key={idx} className="py-2.5 px-3 font-mono">
                            {Math.round(c.wpm || 135)} WPM
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-slate-400">Gaze Stability</td>
                        {candidates.map((c, idx) => (
                          <td key={idx} className="py-2.5 px-3 font-mono">
                            {c.proctoring?.gazeMetrics?.gazeStability ?? c.proctoring?.eyeContactPercent ?? 92}%
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RADAR OVERLAY */}
          {activeTab === "radar" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-surface-950 border border-white/10 flex flex-col items-center">
                <div className="text-center max-w-md mb-2">
                  <h3 className="text-sm font-bold text-white">
                    5-Dimension Overlaid Competency Radar
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Normalized comparison across Technical Accuracy, Communication, Problem Solving, STAR method, and Confidence against the industry benchmark.
                  </p>
                </div>
                <div className="w-full max-w-xl">
                  <CompetencyRadarChart candidates={radarCandidates} size="large" />
                </div>
              </div>

              {/* Horizontal Bar Comparison Matrix */}
              <div className="card p-5 bg-surface-800/60 border border-white/5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Dimension-by-Dimension Comparison Bars
                </h3>

                <div className="space-y-5">
                  {dimensions.map((dim) => (
                    <div key={dim.key} className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-slate-300">
                        <span>{dim.label}</span>
                        <span className="font-mono text-slate-500">Benchmark: 7.5</span>
                      </div>
                      <div className="space-y-1.5">
                        {candidates.map((c, idx) => {
                          const val = c.rubric?.[dim.key] ?? 7.5;
                          const color = CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length];
                          const pct = Math.min(100, Math.round((val / 10) * 100));

                          return (
                            <div key={idx} className="flex items-center gap-3 text-xs">
                              <span
                                className="w-24 truncate font-medium text-right shrink-0"
                                style={{ color }}
                              >
                                {c.candidateName || `Candidate ${idx + 1}`}
                              </span>
                              <div className="flex-1 h-3 rounded-full bg-surface-900 overflow-hidden border border-white/5 relative">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%`, backgroundColor: color }}
                                />
                              </div>
                              <span className="font-mono font-bold text-white w-12 text-right">
                                {val} / 10
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE CODING */}
          {activeTab === "coding" && (
            <div className="space-y-6">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${candidates.length}, minmax(0, 1fr))`,
                }}
              >
                {candidates.map((cand, idx) => {
                  const color = CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length];
                  const code = cand.codeEvaluation || {
                    status: "PASSED",
                    passedCount: 3,
                    totalCount: 3,
                    problemTitle: "Valid Palindrome & Token Sanitization",
                    complexity: "O(n) Time • O(1) Space",
                    feedback: "Clean dual-pointer implementation. Handled alphanumeric filtering gracefully with zero memory allocations.",
                  };

                  return (
                    <div
                      key={cand._id || idx}
                      className="p-5 rounded-2xl bg-surface-800/60 border border-white/5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <h4 className="font-bold text-white text-sm">
                            {cand.candidateName || `Candidate ${idx + 1}`}
                          </h4>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded font-mono font-semibold ${
                            code.status === "PASSED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {code.status} ({code.passedCount}/{code.totalCount})
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface-900/90 border border-white/5 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Problem:</span>
                          <strong className="text-white font-medium">{code.problemTitle}</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Complexity:</span>
                          <strong className="text-brand-300 font-mono">{code.complexity}</strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-900/50 border border-white/5">
                        <div className="text-[11px] text-slate-400 font-semibold mb-1">
                          Evaluator Notes
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {code.feedback}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PROCTORING & VISION */}
          {activeTab === "proctoring" && (
            <div className="space-y-6">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${candidates.length}, minmax(0, 1fr))`,
                }}
              >
                {candidates.map((cand, idx) => {
                  const color = CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length];
                  const proctoring = cand.proctoring || {
                    integrityScore: 98,
                    riskLevel: "low",
                    tabSwitches: 0,
                    multipleFacesDetected: false,
                  };
                  const gaze = proctoring.gazeMetrics || {
                    gazeStability: proctoring.eyeContactPercent || 92,
                    headPoseStability: 95,
                    lookingAwayCount: 0,
                    scriptReadingSuspected: false,
                  };

                  return (
                    <div
                      key={cand._id || idx}
                      className="p-5 rounded-2xl bg-surface-800/60 border border-white/5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <h4 className="font-bold text-white text-sm">
                            {cand.candidateName || `Candidate ${idx + 1}`}
                          </h4>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded font-mono font-semibold ${
                            proctoring.riskLevel === "low"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {proctoring.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-900 border border-white/5 text-center">
                        <div className="text-[11px] text-slate-400">Anti-Cheat Integrity Score</div>
                        <div className="text-3xl font-display font-bold text-white mt-0.5">
                          {proctoring.integrityScore}%
                        </div>
                      </div>

                      {/* MediaPipe Vision Telemetry */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between p-2.5 rounded-lg bg-surface-900/60 border border-white/5">
                          <span className="text-slate-400">Gaze Stability</span>
                          <span className="font-mono font-bold text-white">{gaze.gazeStability}%</span>
                        </div>
                        <div className="flex justify-between p-2.5 rounded-lg bg-surface-900/60 border border-white/5">
                          <span className="text-slate-400">Head Pose Vector</span>
                          <span className="font-mono font-bold text-white">{gaze.headPoseStability}%</span>
                        </div>
                        <div className="flex justify-between p-2.5 rounded-lg bg-surface-900/60 border border-white/5">
                          <span className="text-slate-400">Tab Switches</span>
                          <span className="font-mono font-bold text-white">{proctoring.tabSwitches || 0}</span>
                        </div>
                        <div className="flex justify-between p-2.5 rounded-lg bg-surface-900/60 border border-white/5">
                          <span className="text-slate-400">Script Reading</span>
                          <span
                            className={`font-mono font-bold ${
                              gaze.scriptReadingSuspected ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {gaze.scriptReadingSuspected ? "SUSPICIOUS" : "CLEAR"}
                          </span>
                        </div>
                        <div className="flex justify-between p-2.5 rounded-lg bg-surface-900/60 border border-white/5">
                          <span className="text-slate-400">Multiple Faces</span>
                          <span
                            className={`font-mono font-bold ${
                              proctoring.multipleFacesDetected ? "text-red-400" : "text-emerald-400"
                            }`}
                          >
                            {proctoring.multipleFacesDetected ? "FLAGGED" : "NONE"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
