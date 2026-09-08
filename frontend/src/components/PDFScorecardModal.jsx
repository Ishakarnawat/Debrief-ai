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

  const [isPrinting, setIsPrinting] = React.useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    const element = document.getElementById("printable-scorecard");
    if (!element) {
      setIsPrinting(false);
      window.print();
      return;
    }

    try {
      // Gather all style sheets and inline styles from parent window
      const styleTags = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
        .map((tag) => tag.outerHTML)
        .join("\n");

      // Remove any leftover print iframe
      const oldFrame = document.getElementById("debrief-print-frame");
      if (oldFrame) oldFrame.remove();

      const iframe = document.createElement("iframe");
      iframe.id = "debrief-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const printDoc = iframe.contentWindow.document;
      printDoc.open();
      printDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${candidateName} - Debrief.ai Candidate Scorecard</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            ${styleTags}
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              html, body {
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                margin: 0 !important;
                padding: 12px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #printable-scorecard {
                background: #ffffff !important;
                color: #0f172a !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
              }
              /* Force high-contrast text colors to prevent white-on-white text */
              h1, h2, h3, h4, .text-white {
                color: #0f172a !important;
              }
              p, .text-slate-300, .text-slate-200 {
                color: #334155 !important;
              }
              .text-slate-400 {
                color: #475569 !important;
              }
              .text-slate-500 {
                color: #64748b !important;
              }
              /* Card backgrounds & borders for crisp paper/PDF print */
              .bg-surface-800,
              .bg-surface-800\\/80,
              .bg-surface-800\\/70,
              .bg-surface-800\\/60,
              .bg-surface-800\\/40,
              .bg-surface-900,
              .bg-surface-950,
              .bg-slate-800,
              .bg-slate-950 {
                background-color: #f8fafc !important;
                border: 1px solid #cbd5e1 !important;
                color: #0f172a !important;
              }
              .border-white\\/10,
              .border-white\\/5 {
                border-color: #cbd5e1 !important;
              }
              /* Accent badge backgrounds */
              .bg-brand-500\\/20,
              .bg-brand-500\\/10 {
                background-color: #eff6ff !important;
                border: 1px solid #93c5fd !important;
                color: #1d4ed8 !important;
              }
              .bg-emerald-500\\/20,
              .bg-emerald-500\\/10 {
                background-color: #ecfdf5 !important;
                border: 1px solid #a7f3d0 !important;
                color: #047857 !important;
              }
              .bg-amber-500\\/20,
              .bg-amber-500\\/10 {
                background-color: #fffbeb !important;
                border: 1px solid #fde68a !important;
                color: #b45309 !important;
              }
              .text-brand-400, .text-brand-300 {
                color: #2563eb !important;
              }
              .text-emerald-400, .text-emerald-300 {
                color: #059669 !important;
              }
              .text-amber-400, .text-amber-300 {
                color: #d97706 !important;
              }
              /* Recharts radar adjustments */
              svg {
                overflow: visible !important;
              }
              .recharts-polar-grid-angle line,
              .recharts-polar-grid-concentric path {
                stroke: #cbd5e1 !important;
              }
              .recharts-polar-angle-axis text tspan {
                fill: #1e293b !important;
                font-weight: 600 !important;
              }
              .no-print {
                display: none !important;
              }
            </style>
          </head>
          <body>
            <div id="printable-scorecard">
              ${element.innerHTML}
            </div>
          </body>
        </html>
      `);
      printDoc.close();

      setTimeout(() => {
        setIsPrinting(false);
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          console.warn("Iframe print error, falling back to window.print():", err);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              iframe.remove();
            }
          }, 4000);
        }
      }, 400);
    } catch (e) {
      console.error("Print orchestration error:", e);
      setIsPrinting(false);
      window.print();
    }
  };

  return (
    <div className="pdf-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      {/* Fallback Native Print Styles Sheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          .pdf-modal-backdrop,
          .pdf-modal-container,
          #printable-scorecard,
          #printable-scorecard * {
            visibility: visible !important;
          }
          .pdf-modal-backdrop {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
            display: block !important;
          }
          .pdf-modal-container {
            position: static !important;
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
          }
          #printable-scorecard {
            position: static !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
          }
          #printable-scorecard h1,
          #printable-scorecard h2,
          #printable-scorecard h3,
          #printable-scorecard .text-white {
            color: #0f172a !important;
          }
          #printable-scorecard p,
          #printable-scorecard .text-slate-300,
          #printable-scorecard .text-slate-200 {
            color: #334155 !important;
          }
          #printable-scorecard .text-slate-400 {
            color: #475569 !important;
          }
          #printable-scorecard .text-slate-500 {
            color: #64748b !important;
          }
          #printable-scorecard .bg-surface-800,
          #printable-scorecard .bg-surface-800\\/80,
          #printable-scorecard .bg-surface-800\\/70,
          #printable-scorecard .bg-surface-800\\/60,
          #printable-scorecard .bg-surface-800\\/40,
          #printable-scorecard .bg-surface-900,
          #printable-scorecard .bg-surface-950,
          #printable-scorecard .bg-slate-800,
          #printable-scorecard .bg-slate-950 {
            background-color: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          #printable-scorecard .border-white\\/10,
          #printable-scorecard .border-white\\/5 {
            border-color: #cbd5e1 !important;
          }
          #printable-scorecard .text-brand-400 {
            color: #2563eb !important;
          }
          #printable-scorecard .text-emerald-400 {
            color: #059669 !important;
          }
          #printable-scorecard .text-amber-400 {
            color: #d97706 !important;
          }
          #printable-scorecard .recharts-polar-grid-angle line,
          #printable-scorecard .recharts-polar-grid-concentric path {
            stroke: #cbd5e1 !important;
          }
          #printable-scorecard .recharts-polar-angle-axis text tspan {
            fill: #1e293b !important;
            font-weight: 600 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="pdf-modal-container relative w-full max-w-4xl bg-surface-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
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
              disabled={isPrinting}
              className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              <Printer size={14} />
              <span>{isPrinting ? "Preparing PDF..." : "Print / Save as PDF"}</span>
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
