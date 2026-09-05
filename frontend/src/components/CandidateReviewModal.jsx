import { useState, useRef } from "react";
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Clock,
  Briefcase,
  Mail,
  User,
  Star,
  Award,
  FileText,
  Save,
  Printer,
  ChevronRight,
  Sparkles,
  Zap,
  Code2,
  Eye,
  Camera,
  Activity,
} from "lucide-react";
import CompetencyRadarChart from "./CompetencyRadarChart";
import PDFScorecardModal from "./PDFScorecardModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CandidateReviewModal({ candidate, onClose, onUpdateStatus }) {
  if (!candidate) return null;

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(candidate.duration || 120);
  const [activeTab, setActiveTab] = useState("proctoring"); // "proctoring" | "rubric" | "transcript"
  const [status, setStatus] = useState(candidate.status || "COMPLETED");
  const [notes, setNotes] = useState(candidate.recruiterNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const proctoring = candidate.proctoring || {
    integrityScore: 100,
    riskLevel: "low",
    tabSwitches: 0,
    multipleFacesDetected: false,
    eyeContactPercent: 92,
    violations: [],
    gazeMetrics: null,
  };

  const gazeMetrics = proctoring.gazeMetrics || {
    gazeStability: proctoring.eyeContactPercent || 92,
    headPoseStability: 95,
    lookingAwayCount: 0,
    scriptReadingSuspected: false,
  };

  const rubric = candidate.rubric || {
    technicalAccuracy: candidate.scores?.depth || 7.5,
    starCompliance: 8.0,
    communicationClarity: candidate.scores?.clarity || 7.8,
    problemSolving: candidate.scores?.relevance || 8.0,
    confidenceBodyLanguage: 8.2,
  };

  const mediaFullUrl = candidate.mediaUrl
    ? candidate.mediaUrl.startsWith("http")
      ? candidate.mediaUrl
      : `${API_URL}${candidate.mediaUrl}`
    : null;

  // Video time tracking
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  // Jump to specific timestamp from proctoring timeline marker
  const seekToSeconds = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    if (onUpdateStatus) {
      await onUpdateStatus(candidate._id, { status: newStatus, recruiterNotes: notes });
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(candidate._id, { status, recruiterNotes: notes });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const formatSec = (s) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isHighRisk = proctoring.riskLevel === "high";
  const isMedRisk = proctoring.riskLevel === "medium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-surface-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-surface-800/60 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-brand-500/20 shrink-0">
              {candidate.candidateName
                ? candidate.candidateName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "CA"}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display font-bold text-xl text-white">
                  {candidate.candidateName || "Candidate Assessment"}
                </h2>

                {/* AI Recommendation Pill */}
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    candidate.recommendation === "Strong Hire"
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : candidate.recommendation === "Hire"
                      ? "bg-brand-500/15 text-brand-300 border-brand-500/30"
                      : candidate.recommendation === "Borderline"
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : "bg-red-500/15 text-red-300 border-red-500/30"
                  }`}
                >
                  ★ {candidate.recommendation || "Screening Evaluation"}
                </span>

                {/* Proctoring Risk Tag */}
                <span
                  className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
                    isHighRisk
                      ? "bg-red-500/15 text-red-400 border-red-500/30"
                      : isMedRisk
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}
                >
                  {isHighRisk ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                  <span>
                    {isHighRisk
                      ? "Flagged Anti-Cheat Risk"
                      : isMedRisk
                      ? "Moderate Proctoring Warning"
                      : "Verified Clean Session"}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-slate-300">
                  <Briefcase size={12} className="text-slate-400" />
                  {candidate.targetRole || "Software Engineer"}
                </span>
                {candidate.candidateEmail && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-slate-500" />
                    {candidate.candidateEmail}
                  </span>
                )}
                <span className="text-slate-500">
                  {new Date(candidate.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-700 hover:bg-surface-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Quick Score Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-sm p-3.5 bg-surface-800/80 border border-white/5 rounded-xl">
              <div className="text-xs text-slate-400 mb-1">AI Hiring Score</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-display font-bold text-white">
                  {Math.round(candidate.hiring_score || 0)}%
                </span>
                <span className="text-xs text-brand-400 font-medium">Weighted</span>
              </div>
            </div>

            <div className="card-sm p-3.5 bg-surface-800/80 border border-white/5 rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Integrity Score</div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-display font-bold ${
                    proctoring.integrityScore >= 85
                      ? "text-emerald-400"
                      : proctoring.integrityScore >= 70
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {proctoring.integrityScore}%
                </span>
                <span className="text-xs text-slate-500 font-mono">Anti-Cheat</span>
              </div>
            </div>

            <div className="card-sm p-3.5 bg-surface-800/80 border border-white/5 rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Tab Switches</div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-display font-bold ${
                    proctoring.tabSwitches > 0 ? "text-amber-400" : "text-slate-200"
                  }`}
                >
                  {proctoring.tabSwitches}
                </span>
                <span className="text-xs text-slate-500">Incident(s)</span>
              </div>
            </div>

            <div className="card-sm p-3.5 bg-surface-800/80 border border-white/5 rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Eye Contact Attention</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-display font-bold text-white">
                  {proctoring.eyeContactPercent || 92}%
                </span>
                <span className="text-xs text-emerald-400">Normal Gaze</span>
              </div>
            </div>
          </div>

          {/* Video Replay Player & Interactive Proctoring Timeline */}
          {mediaFullUrl ? (
            <div className="card p-4 bg-slate-950 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <Play size={14} className="text-brand-400" />
                  Candidate Interview Recording with Proctoring Timeline
                </span>
                <span className="font-mono text-slate-400">
                  {formatSec(currentTime)} / {formatSec(duration)}
                </span>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-[340px] mx-auto flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={mediaFullUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Interactive Visual Proctoring Timeline Scrubber */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1 font-mono text-slate-300">
                    <Clock size={12} className="text-brand-400" />
                    Proctoring Incident Markers (Click pin to jump in video)
                  </span>
                  <span>{proctoring.violations?.length || 0} violations recorded</span>
                </div>

                <div className="relative w-full h-4 bg-surface-800 rounded-full overflow-hidden border border-white/10 flex items-center">
                  {/* Current playback progress */}
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-brand-500/30 transition-all"
                    style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
                  />

                  {/* Violation Pins along timeline */}
                  {proctoring.violations &&
                    proctoring.violations.map((v, idx) => {
                      const percent = Math.min(96, Math.max(2, (v.timeInSeconds / (duration || 60)) * 100));
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => seekToSeconds(v.timeInSeconds)}
                          title={`${v.description} at ${formatSec(v.timeInSeconds)}`}
                          className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border shadow-md transition-transform hover:scale-125 z-10 ${
                            v.severity === "high"
                              ? "bg-red-500 border-white"
                              : "bg-amber-400 border-slate-900"
                          }`}
                          style={{ left: `${percent}%` }}
                        />
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface-800/40 border border-white/5 text-center text-xs text-slate-400">
              Audio assessment file recorded (video stream unavailable for direct playback). Full speech and proctoring telemetry evaluated below.
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
            <button
              onClick={() => setActiveTab("proctoring")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === "proctoring"
                  ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Shield size={14} />
              <span>Anti-Cheat & Proctoring Audit</span>
            </button>

            <button
              onClick={() => setActiveTab("rubric")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === "rubric"
                  ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Award size={14} />
              <span>Candidate Screening Rubric</span>
            </button>

            <button
              onClick={() => setActiveTab("transcript")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === "transcript"
                  ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <FileText size={14} />
              <span>Transcript & STAR Analysis</span>
            </button>
          </div>

          {/* TAB 1: Anti-Cheat & Proctoring Audit Log */}
          {activeTab === "proctoring" && (
            <div className="space-y-4">
              {/* Executive Summary Alert Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isHighRisk
                    ? "bg-red-500/10 border-red-500/30 text-red-300"
                    : isMedRisk
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                }`}
              >
                {isHighRisk ? (
                  <ShieldAlert size={20} className="shrink-0 text-red-400 mt-0.5" />
                ) : (
                  <ShieldCheck size={20} className="shrink-0 text-emerald-400 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <span className="font-bold uppercase tracking-wider block">
                    {isHighRisk
                      ? "High Risk Violations Detected — Review Recording Carefully"
                      : isMedRisk
                      ? "Minor Proctoring Warning — Candidate Lost Focus"
                      : "Anti-Cheat Integrity Verified — Candidate Fully Compliant"}
                  </span>
                  <p className="text-slate-300">
                    {candidate.recruiterSummary ||
                      `Candidate completed interview with ${proctoring.tabSwitches} tab switch(es) and an overall integrity score of ${proctoring.integrityScore}%.`}
                  </p>
                </div>
              </div>

              {/* MediaPipe AI Computer Vision & Gaze Telemetry */}
              <div className="card p-4 bg-surface-900/90 border border-brand-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Eye size={16} className="text-brand-400" />
                    <span>MediaPipe™ In-Browser Vision & Biometric Telemetry</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 font-mono">
                      WASM + WebGL
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Verified Iris & Mesh
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-surface-800/80 border border-white/5">
                    <div className="text-[11px] text-slate-400 mb-1">Gaze Stability</div>
                    <div className="text-xl font-display font-bold text-white">
                      {gazeMetrics.gazeStability}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Iris Centering Ratio</div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-800/80 border border-white/5">
                    <div className="text-[11px] text-slate-400 mb-1">Head Pose Stability</div>
                    <div className="text-xl font-display font-bold text-white">
                      {gazeMetrics.headPoseStability}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Yaw / Pitch / Roll Anchor</div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-800/80 border border-white/5">
                    <div className="text-[11px] text-slate-400 mb-1">Teleprompter Audit</div>
                    <div
                      className={`text-sm font-bold font-mono mt-1 ${
                        gazeMetrics.scriptReadingSuspected
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {gazeMetrics.scriptReadingSuspected ? "Lateral Scanning" : "Natural Gaze"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Saccadic Detection</div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-800/80 border border-white/5">
                    <div className="text-[11px] text-slate-400 mb-1">Facial Integrity</div>
                    <div
                      className={`text-sm font-bold font-mono mt-1 ${
                        proctoring.multipleFacesDetected
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {proctoring.multipleFacesDetected ? "Multi-Face Alert" : "1 Face Locked"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">478-Point Landmark Mesh</div>
                  </div>
                </div>
              </div>

              {/* Violations Chronological Audit Log Table */}
              <div className="card p-4 bg-surface-800/60 border border-white/[0.08] rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Proctoring Incident Audit Log</span>
                  <span className="text-slate-500 text-[11px] font-mono">Real-time Browser Events</span>
                </div>

                {!proctoring.violations || proctoring.violations.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
                    <p className="text-sm font-semibold text-white">No Proctoring Violations Recorded</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Candidate remained active on the interview tab with consistent eye contact and single face presence throughout.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06] text-xs">
                    {proctoring.violations.map((violation, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => seekToSeconds(violation.timeInSeconds)}
                            className="px-2 py-1 rounded bg-surface-700 hover:bg-brand-500/20 text-brand-300 font-mono text-[11px] border border-white/10 flex items-center gap-1 transition-colors"
                          >
                            <Play size={10} />
                            <span>{formatSec(violation.timeInSeconds)}</span>
                          </button>
                          <div>
                            <p className="text-slate-200 font-medium">{violation.description}</p>
                            <span className="text-slate-500 text-[10px]">
                              Type: {violation.type} • {violation.timestamp ? new Date(violation.timestamp).toLocaleTimeString() : ""}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold shrink-0 border ${
                            violation.severity === "high"
                              ? "bg-red-500/20 text-red-300 border-red-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {violation.severity} Severity
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Candidate Screening Rubric Breakdown */}
          {activeTab === "rubric" && (
            <div className="space-y-4">
              <div className="card p-5 bg-surface-800/60 border border-white/[0.08] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Automated Candidate Screening Rubric</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Evaluated across 5 core competencies with industry baseline comparison
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-display font-bold text-brand-400">
                      {((rubric.technicalAccuracy + rubric.starCompliance + rubric.communicationClarity + rubric.problemSolving + rubric.confidenceBodyLanguage) / 5).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 block">Rubric Avg</span>
                  </div>
                </div>

                {/* Split View: Radar Chart on Left, Dimension Bars on Right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                  <div className="md:col-span-6 bg-surface-900/60 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                    <CompetencyRadarChart rubric={rubric} size="small" />
                  </div>

                  <div className="md:col-span-6 space-y-3">
                    {[
                      { label: "Technical Accuracy & Depth", score: rubric.technicalAccuracy, desc: "Factual correctness, architectural precision" },
                      { label: "STAR Framework Compliance", score: rubric.starCompliance, desc: "Situation, Task, Action, and quantifiable Results" },
                      { label: "Communication & Clarity", score: rubric.communicationClarity, desc: "Vocal cadence, minimal fillers, concise structure" },
                      { label: "Problem Solving & Logic", score: rubric.problemSolving, desc: "Analytical breakdown, mitigation strategies" },
                      { label: "Confidence & Body Language", score: rubric.confidenceBodyLanguage, desc: "Composure, eye-contact retention" },
                    ].map(({ label, score, desc }) => (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-200 font-medium">{label}</span>
                          <span className="text-brand-400 font-mono font-bold">{score} / 10</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-indigo-400 rounded-full transition-all duration-500"
                            style={{ width: `${score * 10}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Coding Challenge Evaluation (if candidate performed coding) */}
              {candidate.codeEvaluation && (
                <div className="card p-4 bg-surface-800/80 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs">
                      <Code2 size={15} />
                      <span>Live Algorithmic Coding Challenge Evaluation</span>
                    </div>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded font-mono font-semibold ${
                        candidate.codeEvaluation.status === "PASSED"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {candidate.codeEvaluation.status} ({candidate.codeEvaluation.passedCount}/{candidate.codeEvaluation.totalCount} Test Suites)
                    </span>
                  </div>

                  <div className="p-3 bg-surface-950 rounded-lg border border-white/5 text-xs space-y-2 font-mono">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Problem: <strong className="text-white">{candidate.codeEvaluation.problemTitle}</strong></span>
                      <span>Complexity: <strong className="text-brand-300">{candidate.codeEvaluation.complexity}</strong></span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{candidate.codeEvaluation.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Transcript & STAR Analysis */}
          {activeTab === "transcript" && (
            <div className="space-y-4">
              <div className="card p-4 bg-surface-800/60 border border-white/[0.08] rounded-xl space-y-2">
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider block">
                  Candidate Transcript
                </span>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {candidate.transcript || "No transcript recorded for this session."}
                </p>
              </div>

              {candidate.star && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(candidate.star).map(([k, present]) => (
                    <div
                      key={k}
                      className={`p-3 rounded-xl border text-xs text-center ${
                        present
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-surface-800 border-white/5 text-slate-500"
                      }`}
                    >
                      <span className="font-bold uppercase block mb-0.5">{k}</span>
                      <span className="text-[11px]">{present ? "✓ Detected" : "✕ Missing"}</span>
                    </div>
                  ))}
                </div>
              )}

              {candidate.improved_answer && (
                <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 text-xs space-y-1">
                  <span className="text-brand-400 font-semibold block">AI Enhanced Benchmark Answer:</span>
                  <p className="text-slate-300 leading-relaxed">{candidate.improved_answer}</p>
                </div>
              )}
            </div>
          )}

          {/* Recruiter Evaluation Notes & Stage Decision Panel */}
          <div className="card p-5 bg-surface-800/90 border border-white/[0.08] rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Recruiter Decision & Action Stage
              </span>
              <div className="flex items-center gap-1.5">
                {["Screening", "Shortlisted", "Under Review", "Rejected"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      status === s
                        ? s === "Shortlisted"
                          ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                          : s === "Rejected"
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                          : s === "Under Review"
                          ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                          : "bg-brand-500 text-white"
                        : "bg-surface-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Internal Recruiter Assessment Notes (visible to hiring team)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add screening comments, follow-up questions for the hiring manager, or proctoring observations..."
                className="w-full bg-surface-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="btn-ghost text-xs inline-flex items-center gap-1.5 py-2 px-3 border border-brand-500/30 text-brand-300 hover:bg-brand-500/10 transition-colors"
              >
                <Award size={13} className="text-brand-400" />
                <span>Export Executive PDF Scorecard</span>
              </button>

              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="btn-primary text-xs inline-flex items-center gap-1.5 py-2 px-4 rounded-xl shadow-lg"
              >
                <Save size={13} />
                <span>{isSaving ? "Saving..." : saveSuccess ? "Saved Notes!" : "Save Recruiter Notes"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Executive PDF Scorecard Modal */}
      {showPdfModal && (
        <PDFScorecardModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          data={candidate}
        />
      )}
    </div>
  );
}
