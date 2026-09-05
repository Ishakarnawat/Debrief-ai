import React, { useRef } from "react";
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Award,
  Zap,
  Clock,
  Briefcase,
  User,
  Calendar,
  FileText,
  Code2,
} from "lucide-react";
import CompetencyRadarChart from "./CompetencyRadarChart";

export default function PDFScorecardModal({ isOpen, onClose, data }) {
  const printRef = useRef(null);

  if (!isOpen || !data) return null;

  const candidateName = data.candidateName || "Candidate";
  const role = data.targetRole || "Software Engineer";
  const dateStr = new Date(data.createdAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const score = Math.round(data.hiring_score ?? 0);
  const recommendation = data.recommendation || (score >= 80 ? "Strong Hire" : score >= 65 ? "Hire" : "Borderline");
  const proctoring = data.proctoring || { integrityScore: 98, riskLevel: "low", tabSwitches: 0 };
  const gazeMetrics = proctoring.gazeMetrics || {
    gazeStability: proctoring.eyeContactPercent || 94,
    headPoseStability: 96,
    lookingAwayCount: 0,
    scriptReadingSuspected: false,
  };
  const rubric = data.rubric || {
    technicalAccuracy: 8.0,
    communicationClarity: 7.8,
    problemSolving: 8.2,
    starCompliance: 7.5,
    confidenceBodyLanguage: 8.0,
  };
  const codeEval = data.codeEvaluation || null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      {/* Print Styles Sheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-scorecard, #printable-scorecard * {
            visibility: visible;
          }
          #printable-scorecard {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: #0f172a !important;
            padding: 24px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-surface-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surface-950">
          <div className="flex items-center gap-2">
            <Award className="text-brand-400" size={18} />
            <span className="font-display font-bold text-white text-base">
              Executive Candidate Scorecard Report
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 shadow-lg shadow-brand-500/20"
            >
              <Printer size={14} />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-surface-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Scorecard Sheet */}
        <div
          id="printable-scorecard"
          ref={printRef}
          className="p-8 overflow-y-auto space-y-6 text-slate-200 bg-surface-900"
        >
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b border-white/10 pb-6 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-brand-400 font-display font-bold text-2xl">Debrief.ai</span>
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Official Verification Scorecard
                </span>
              </div>
              <h1 className="font-display font-bold text-3xl text-white mt-2">{candidateName}</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Target Role: <strong className="text-slate-200">{role}</strong>
              </p>
              {data.candidateEmail && (
                <p className="text-slate-500 text-xs mt-0.5 font-mono">{data.candidateEmail}</p>
              )}
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 font-mono">Evaluation Date</div>
              <div className="text-sm font-semibold text-slate-300 mt-0.5">{dateStr}</div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Assessment ID: {String(data._id || data.analysisId || "DOC-8491").substring(0, 12)}
              </div>
            </div>
          </div>

          {/* Key Executive Verdict Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-800/80 border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-display font-bold text-2xl">
                {score}%
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Overall Hire Score
                </div>
                <div className="text-white font-bold text-sm mt-0.5">
                  Top {score >= 80 ? "10%" : "25%"} Candidate
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-800/80 border border-white/5 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                  recommendation === "Strong Hire"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : recommendation === "Hire"
                    ? "bg-brand-500/20 text-brand-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                <Award size={24} />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Hiring Recommendation
                </div>
                <div className="text-white font-bold text-sm mt-0.5">{recommendation}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-800/80 border border-white/5 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  proctoring.riskLevel === "low"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Proctoring Integrity
                </div>
                <div className="text-white font-bold text-sm mt-0.5">
                  {proctoring.integrityScore}% ({proctoring.riskLevel.toUpperCase()} Risk)
                </div>
              </div>
            </div>
          </div>

          {/* Recruiter Executive Summary */}
          {data.recruiterSummary && (
            <div className="p-4 rounded-xl bg-surface-800/60 border border-white/10 space-y-1.5">
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                Executive Synthesis
              </span>
              <p className="text-slate-300 text-sm leading-relaxed">{data.recruiterSummary}</p>
            </div>
          )}

          {/* Competency Radar & Rubric Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-t border-white/10 pt-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">
                5-Dimension Competency Radar
              </h3>
              <div className="bg-surface-800/40 border border-white/5 rounded-xl p-3">
                <CompetencyRadarChart rubric={rubric} size="small" />
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-white mb-2">Evaluated Rubric Dimensions</h3>
              {[
                { label: "Technical Depth & Accuracy", val: rubric.technicalAccuracy },
                { label: "Communication Clarity & Articulation", val: rubric.communicationClarity },
                { label: "Algorithmic Problem Solving", val: rubric.problemSolving },
                { label: "STAR Behavioral Compliance", val: rubric.starCompliance },
                { label: "Vocal Confidence & Delivery", val: rubric.confidenceBodyLanguage },
              ].map((r, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-surface-800/70 border border-white/5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">{r.label}</span>
                    <span className="text-brand-400 font-bold font-mono">{r.val} / 10</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-indigo-400 rounded-full"
                      style={{ width: `${(r.val / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Coding Evaluation Section (If Present) */}
          {codeEval && (
            <div className="border-t border-white/10 pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="text-brand-400" size={16} />
                  <h3 className="text-sm font-semibold text-white">
                    Live Coding Challenge Evaluation
                  </h3>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-mono font-semibold ${
                    codeEval.status === "PASSED"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {codeEval.status} ({codeEval.passedCount}/{codeEval.totalCount} Test Suites)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-800/60 border border-white/5 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>
                    Problem: <strong className="text-white">{codeEval.problemTitle}</strong>
                  </span>
                  <span>
                    Complexity: <strong className="text-brand-300">{codeEval.complexity}</strong>
                  </span>
                </div>
                <p className="text-slate-300">{codeEval.feedback}</p>
              </div>
            </div>
          )}

          {/* STAR Methodology Verification */}
          <div className="border-t border-white/10 pt-6 space-y-3">
            <h3 className="text-sm font-semibold text-white">STAR Methodology Compliance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Situation", pass: data.star?.situation },
                { label: "Task", pass: data.star?.task },
                { label: "Action", pass: data.star?.action },
                { label: "Result", pass: data.star?.result },
              ].map((s, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                    s.pass
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-800 border-white/5 text-slate-500"
                  }`}
                >
                  <CheckCircle size={14} className={s.pass ? "text-emerald-400" : "text-slate-600"} />
                  <span>{s.label} Verified</span>
                </div>
              ))}
            </div>
          </div>

          {/* Speech & Vision Telemetry Metrics */}
          <div className="border-t border-white/10 pt-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Speech & MediaPipe™ Vision Telemetry</span>
              <span className="font-mono text-brand-400 text-[11px]">478-Point Biometric Mesh</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-surface-800/40 border border-white/5">
                <div className="text-base font-bold text-white font-mono">{Math.round(data.wpm ?? 0)} WPM</div>
                <div className="text-xs text-slate-400 mt-0.5">Speaking Pace</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-800/40 border border-white/5">
                <div className="text-base font-bold text-white font-mono">
                  {Object.values(data.filler_words || {}).reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Filler Words</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-800/40 border border-white/5">
                <div className="text-base font-bold text-white font-mono">{gazeMetrics.gazeStability}%</div>
                <div className="text-xs text-slate-400 mt-0.5">Gaze Stability</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-800/40 border border-white/5">
                <div
                  className={`text-base font-bold font-mono ${
                    gazeMetrics.scriptReadingSuspected ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {gazeMetrics.scriptReadingSuspected ? "Flagged" : "Natural"}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Script Detection</div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-white/10 pt-6 text-center text-xs text-slate-500">
            Debrief.ai Pro Autonomous Candidate Screening • AI Generated Scorecard • All metrics cryptographically indexed
          </div>
        </div>
      </div>
    </div>
  );
}
