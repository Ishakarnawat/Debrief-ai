import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Upload, Clock, Zap } from "lucide-react";

import ScoreCard      from "../components/ScoreCard";
import HiringScore    from "../components/HiringScore";
import WeaknessList   from "../components/WeaknessList";
import STARAnalysis   from "../components/STARAnalysis";
import FillerChart    from "../components/FillerChart";
import ImprovedAnswer from "../components/ImprovedAnswer";
import TranscriptCard from "../components/TranscriptCard";
import { useHistory }  from "../hooks/useAnalyze";

/* ── Stat pill ───────────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value, sub }) {
  return (
    <div className="card-sm flex items-center gap-3">
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
function HistoryRow({ item, onSelect }) {
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return (
    <button
      onClick={() => onSelect(item)}
      className="w-full text-left flex items-center gap-4 p-3 rounded-xl
                 hover:bg-white/5 border border-transparent hover:border-white/[0.06]
                 transition-all duration-200 group"
    >
      <div className="w-10 h-10 rounded-lg bg-surface-600 flex items-center justify-center shrink-0">
        <Zap size={14} className="text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-300 text-sm font-medium truncate">
          {item.filename || "Interview Recording"}
        </p>
        <p className="text-slate-600 text-xs mt-0.5">{date}</p>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-sm font-display font-bold
          ${item.hiring_score >= 70 ? "text-emerald-400" :
            item.hiring_score >= 45 ? "text-amber-400" : "text-red-400"}`}>
          {Math.round(item.hiring_score ?? 0)}%
        </div>
        <div className="text-xs text-slate-600">hire score</div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchHistory, history, loading: histLoading } = useHistory();

  // Result can come from navigation state (just analyzed) or history selection
  const [data, setData] = useState(location.state?.result || null);

  useEffect(() => { fetchHistory(); }, []);

  // ── Empty state ──────────────────────────────────────────────
  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-display font-bold text-3xl text-white mb-2">Analysis History</h1>
        <p className="text-slate-500 mb-8">Select a past analysis or upload a new recording.</p>

        {histLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 shimmer rounded-xl" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🎙️</div>
            <p className="text-slate-400 mb-5">No analyses yet — upload your first interview!</p>
            <button onClick={() => navigate("/upload")} className="btn-primary inline-flex items-center gap-2">
              <Upload size={15} /> Analyze Interview
            </button>
          </div>
        ) : (
          <div className="card space-y-1">
            {history.map(item => (
              <HistoryRow key={item._id} item={item} onSelect={setData} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Full results view ────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setData(null)}
          className="w-9 h-9 rounded-xl bg-surface-700 border border-white/[0.06] flex items-center
                     justify-center hover:border-brand-500/40 transition-colors"
        >
          <ArrowLeft size={15} className="text-slate-400" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Interview Debrief</h1>
          <p className="text-slate-500 text-sm">AI-powered performance analysis</p>
        </div>
      </div>

      {/* Stat pills row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatPill icon={Zap}   label="Words / min" value={`${Math.round(data.wpm ?? 0)}`} />
        <StatPill icon={Clock} label="Confidence"  value={`${data.confidence_score ?? "—"}%`} />
        <StatPill icon={Zap}   label="Filler words" value={Object.values(data.filler_words || {}).reduce((a,b)=>a+b,0)} />
        <StatPill icon={Zap}   label="Avg score"
          value={`${(((data.scores?.clarity??0) + (data.scores?.depth??0) + (data.scores?.relevance??0))/3).toFixed(1)}/10`}
        />
      </div>

      {/* Top grid: scores + hiring */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <ScoreCard label="Clarity"   score={data.scores?.clarity}   color="brand"   />
        <ScoreCard label="Depth"     score={data.scores?.depth}     color="violet"  />
        <ScoreCard label="Relevance" score={data.scores?.relevance} color="emerald" />
        <HiringScore score={data.hiring_score} />
      </div>

      {/* STAR + Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <STARAnalysis star={data.star} />
        <WeaknessList weaknesses={data.weaknesses} />
      </div>

      {/* Filler chart */}
      <div className="mb-6">
        <FillerChart fillerWords={data.filler_words} />
      </div>

      {/* Improved answer + follow-up */}
      <div className="mb-6">
        <ImprovedAnswer answer={data.improved_answer} followUp={data.follow_up_question} />
      </div>

      {/* Transcript */}
      <TranscriptCard transcript={data.transcript} />

      {/* Analyze another */}
      <div className="mt-8 text-center">
        <button onClick={() => navigate("/upload")} className="btn-ghost inline-flex items-center gap-2">
          <Upload size={14} /> Analyze Another Interview
        </button>
      </div>
    </div>
  );
}
