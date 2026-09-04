import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Upload,
  Clock,
  Zap,
  Video,
  Mic,
  User,
  Briefcase,
  HelpCircle,
  PlayCircle,
  Trash2,
  Lock,
  Shield,
  Award,
  Code2,
} from "lucide-react";

import ScoreCard from "../components/ScoreCard";
import HiringScore from "../components/HiringScore";
import WeaknessList from "../components/WeaknessList";
import STARAnalysis from "../components/STARAnalysis";
import FillerChart from "../components/FillerChart";
import ImprovedAnswer from "../components/ImprovedAnswer";
import TranscriptCard from "../components/TranscriptCard";
import CompetencyRadarChart from "../components/CompetencyRadarChart";
import PDFScorecardModal from "../components/PDFScorecardModal";
import { useHistory } from "../hooks/useAnalyze";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ── Stat pill ───────────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="card-sm flex items-center gap-3 bg-surface-800/80 border border-white/[0.06] p-3.5 rounded-xl">
      <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-brand-400" />
      </div>
      <div>
        <div className="font-display font-bold text-white text-lg leading-tight">{value}</div>
        <div className="text-slate-500 text-xs">{label}</div>
      </div>
    </div>
  );
}

/* ── History row ─────────────────────────────────────────────── */
function HistoryRow({ item, onSelect, onDelete }) {
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const isVideo = item.mediaType === "video";
  const isPrivate = item.isPrivate !== false;

  return (
    <div
      onClick={() => onSelect(item)}
      className="w-full text-left flex items-center justify-between gap-4 p-4 rounded-xl
                 hover:bg-white/5 border border-transparent hover:border-white/[0.08]
                 transition-all duration-200 group bg-surface-800/40 cursor-pointer"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isVideo ? "bg-red-500/10 text-red-400" : "bg-brand-500/10 text-brand-400"
          }`}
        >
          {isVideo ? <Video size={16} /> : <Mic size={16} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-slate-200 text-sm font-semibold truncate">
              {item.candidateName ? `${item.candidateName} • ${item.targetRole || "Candidate"}` : item.filename || "Interview Assessment"}
            </p>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                isVideo
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-brand-500/10 text-brand-400 border border-brand-500/20"
              }`}
            >
              {isVideo ? "VIDEO" : "AUDIO"}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                isPrivate
                  ? "bg-brand-500/10 text-brand-300 border border-brand-500/20"
                  : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              }`}
            >
              {isPrivate ? "🔒 Private" : "🏢 Recruiter"}
            </span>
          </div>
          <p className="text-slate-400 text-xs truncate mt-0.5">{item.question || item.filename}</p>
          <p className="text-slate-500 text-[11px] mt-0.5">{date}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <div
            className={`text-sm font-display font-bold ${
              item.hiring_score >= 70
                ? "text-emerald-400"
                : item.hiring_score >= 45
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {Math.round(item.hiring_score ?? 0)}%
          </div>
          <div className="text-xs text-slate-500">hire score</div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Are you sure you want to permanently delete this recording and assessment data?")) {
              onDelete(item._id);
            }
          }}
          title="Permanently delete recording & assessment"
          className="p-2 rounded-lg bg-surface-700/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchHistory, deleteAnalysis, history, loading: histLoading } = useHistory();

  // Result can come from navigation state (just analyzed) or history selection
  const [data, setData] = useState(location.state?.result || null);
  const [showScorecard, setShowScorecard] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteAnalysis(id);
      if (data && (data._id === id || data.analysisId === id)) {
        setData(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Empty state / History list ──────────────────────────────
  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl text-white mb-1">Assessment Records</h1>
            <p className="text-slate-400 text-sm">Review past interview recordings, candidate scores, and AI debriefs.</p>
          </div>
          <button
            onClick={() => navigate("/upload")}
            className="btn-primary inline-flex items-center gap-2 text-xs font-semibold py-2.5 px-4"
          >
            <Video size={14} /> New Interview
          </button>
        </div>

        {histLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 shimmer rounded-xl" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="card text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto text-2xl">
              <Video size={28} />
            </div>
            <div>
              <h3 className="text-white font-display font-semibold text-lg">No Assessments Yet</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                Record your first video or audio response to get instant STAR analysis and hiring readiness scores.
              </p>
            </div>
            <button
              onClick={() => navigate("/upload")}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Upload size={15} /> Start First Interview
            </button>
          </div>
        ) : (
          <div className="card p-3 space-y-2 bg-surface-900 border border-white/[0.08] rounded-2xl">
            {history.map((item) => (
              <HistoryRow key={item._id} item={item} onSelect={setData} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const mediaFullUrl = data.mediaUrl ? `${API_URL}${data.mediaUrl}` : null;
  const isVideoMedia = data.mediaType === "video";

  // ── Full results view ────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in space-y-6">
      {/* Top Navigation & Info Header */}
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-6 flex-wrap">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setData(null)}
            className="w-10 h-10 rounded-xl bg-surface-700 border border-white/[0.08] flex items-center justify-center hover:border-brand-500/40 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-white">
                {data.candidateName ? `${data.candidateName}` : "Interview Assessment"}
              </h1>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                  isVideoMedia
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                }`}
              >
                {isVideoMedia ? "VIDEO SESSION" : "AUDIO SESSION"}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  data.isPrivate !== false
                    ? "bg-brand-500/10 text-brand-300 border border-brand-500/20"
                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                }`}
              >
                {data.isPrivate !== false ? "🔒 Private Practice" : "🏢 Recruiter Submission"}
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Target Role: <span className="text-slate-200 font-medium">{data.targetRole || "General"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowScorecard(true)}
            className="btn-primary text-xs inline-flex items-center gap-1.5 py-2 px-3 shadow-lg shadow-brand-500/20"
          >
            <Award size={13} /> Export PDF Scorecard
          </button>
          <button
            onClick={() => {
              const idToDelete = data._id || data.analysisId;
              if (idToDelete && window.confirm("Are you sure you want to permanently delete this recording and all assessment data from the server?")) {
                handleDelete(idToDelete);
              }
            }}
            className="btn-ghost text-xs inline-flex items-center gap-1.5 py-2 px-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} /> Delete Recording
          </button>
          <button
            onClick={() => navigate("/upload")}
            className="btn-ghost text-xs inline-flex items-center gap-1.5 py-2 px-3 border border-white/10"
          >
            <Upload size={13} /> New Assessment
          </button>
        </div>
      </div>

      {/* Question Context Banner */}
      {data.question && (
        <div className="p-4 rounded-xl bg-surface-800/80 border border-brand-500/20 flex items-start gap-3">
          <HelpCircle size={18} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider block mb-0.5">
              Assessed Question Prompt
            </span>
            <p className="text-white text-sm font-medium">{data.question}</p>
          </div>
        </div>
      )}

      {/* Video Replay Player / Privacy Notice */}
      {isVideoMedia && (
        <div className="card p-4 bg-slate-950 border border-white/10 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <PlayCircle size={15} className="text-brand-400" />
              <span>Recorded Candidate Video Playback</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {mediaFullUrl ? "🔒 Protected Stream" : "🛡️ Ephemeral (No Video Saved)"}
            </span>
          </div>

          {mediaFullUrl ? (
            <div className="rounded-xl overflow-hidden aspect-video max-h-[360px] bg-black mx-auto flex items-center justify-center">
              <video src={mediaFullUrl} controls className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-surface-900 border border-white/5 text-center space-y-1.5">
              <p className="text-sm font-medium text-slate-300 flex items-center justify-center gap-1.5">
                <Shield size={16} className="text-emerald-400" />
                <span>Ephemeral Privacy Mode Active</span>
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                The video recording was evaluated in memory and discarded immediately after analysis. No video file remains stored on the server.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stat pills row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill icon={Zap} label="Speech Pace" value={`${Math.round(data.wpm ?? 0)} WPM`} />
        <StatPill icon={Clock} label="Confidence Score" value={`${data.confidence_score ?? "82"}%`} />
        <StatPill
          icon={Zap}
          label="Filler Words Count"
          value={Object.values(data.filler_words || {}).reduce((a, b) => a + b, 0)}
        />
        <StatPill
          icon={Zap}
          label="Communication Avg"
          value={`${(
            ((data.scores?.clarity ?? 0) + (data.scores?.depth ?? 0) + (data.scores?.relevance ?? 0)) /
            3
          ).toFixed(1)}/10`}
        />
      </div>

      {/* Top grid: scores + hiring */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ScoreCard label="Clarity" score={data.scores?.clarity} color="brand" />
        <ScoreCard label="Depth" score={data.scores?.depth} color="violet" />
        <ScoreCard label="Relevance" score={data.scores?.relevance} color="emerald" />
        <HiringScore score={data.hiring_score} />
      </div>

      {/* Competency Radar & Rubric Section */}
      <div className="card p-6 bg-surface-900 border border-white/10 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">5-Dimension Competency Radar</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-metric evaluation against industry standard baseline (7.5/10)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowScorecard(true)}
            className="btn-ghost text-xs inline-flex items-center gap-1.5 py-1.5 px-3 border border-brand-500/30 text-brand-300 hover:bg-brand-500/10 transition-colors"
          >
            <Award size={13} /> View Scorecard
          </button>
        </div>

        <div className="bg-surface-950/60 border border-white/5 rounded-xl p-4">
          <CompetencyRadarChart rubric={data.rubric} />
        </div>
      </div>

      {/* Live Coding Challenge Results (if present) */}
      {data.codeEvaluation && (
        <div className="card p-5 bg-surface-900 border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm">
              <Code2 size={16} />
              <span>Technical Live Coding Evaluation</span>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-mono font-semibold ${
                data.codeEvaluation.status === "PASSED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {data.codeEvaluation.status} ({data.codeEvaluation.passedCount}/{data.codeEvaluation.totalCount} Test Suites)
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-white/5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-mono">
              <span>Problem: <strong className="text-white">{data.codeEvaluation.problemTitle}</strong></span>
              <span>Complexity: <strong className="text-brand-300">{data.codeEvaluation.complexity}</strong></span>
            </div>
            <p className="text-slate-300 leading-relaxed">{data.codeEvaluation.feedback}</p>
          </div>
        </div>
      )}

      {/* STAR + Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4">
        <STARAnalysis star={data.star} />
        <WeaknessList weaknesses={data.weaknesses} />
      </div>

      {/* Filler chart */}
      <div>
        <FillerChart fillerWords={data.filler_words} />
      </div>

      {/* Improved answer + follow-up */}
      <div>
        <ImprovedAnswer answer={data.improved_answer} followUp={data.follow_up_question} />
      </div>

      {/* Transcript */}
      <TranscriptCard transcript={data.transcript} />

      {/* Analyze another */}
      <div className="pt-4 text-center">
        <button
          onClick={() => navigate("/upload")}
          className="btn-primary inline-flex items-center gap-2 py-3 px-6 rounded-xl shadow-lg shadow-brand-500/20"
        >
          <Video size={16} /> Conduct Another Interview
        </button>
      </div>

      {/* PDF Scorecard Modal */}
      {showScorecard && (
        <PDFScorecardModal
          isOpen={showScorecard}
          onClose={() => setShowScorecard(false)}
          data={data}
        />
      )}
    </div>
  );
}
