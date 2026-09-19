import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Briefcase,
  ArrowRight,
  Sparkles,
  BarChart2,
  Video,
  Brain,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
  Lock
} from "lucide-react";
import { isClerkConfigured, useAppAuth } from "../context/AuthContext";
import { SignIn, SignUp } from "@clerk/clerk-react";

export default function AuthPage() {
  const [candidateName, setCandidateName] = useState("Alex Mercer");
  const [candidateEmail, setCandidateEmail] = useState("alex.mercer@candidate.com");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState("sign-in");

  const navigate = useNavigate();
  const { loginAsCandidate } = useAppAuth();

  const handleCandidateLogin = (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      loginAsCandidate(candidateEmail || "alex.mercer@candidate.com", candidateName || "Alex Mercer");
      setIsSubmitting(false);
      navigate("/upload");
    }, 400);
  };

  const handleQuickCandidateDemo = () => {
    loginAsCandidate("alex.mercer@candidate.com", "Alex Mercer");
    navigate("/upload");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-surface-950">
      {/* Cyan/Blue ambient glowing backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[650px] h-[400px] rounded-full bg-cyan-600/15 blur-[130px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 flex flex-col items-center mb-8 text-center max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-5 backdrop-blur-md">
          <User size={14} className="text-cyan-400" />
          <span>Candidate & Student Portal</span>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] mb-4">
          <BarChart2 size={32} className="text-white" />
        </div>

        <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-white mb-3">
          Candidate <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">Workspace</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Sign in to sharpen your technical & behavioral interview skills with real-time AI avatars, eye-gaze tracking, and personal STAR rubric evaluations.
        </p>
      </div>

      {isClerkConfigured ? (
        <div className="relative z-10 w-full max-w-md">
          <div className="flex gap-1 p-1 bg-surface-800 rounded-xl mb-6 border border-white/[0.06]">
            {["sign-in", "sign-up"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-display font-semibold transition-all ${
                  mode === m ? "bg-cyan-500 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m === "sign-in" ? "Candidate Sign In" : "New Candidate Sign Up"}
              </button>
            ))}
          </div>

          {mode === "sign-in" ? (
            <SignIn routing="hash" redirectUrl="/upload" />
          ) : (
            <SignUp routing="hash" redirectUrl="/upload" />
          )}

          <div className="mt-6 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              <ShieldAlert size={14} />
              <span>Are you an Administrator or Recruiter? Go to Admin Portal →</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Candidate Login Card */
        <div className="relative z-10 w-full max-w-md">
          <div className="card p-8 bg-surface-900/90 border border-cyan-500/20 shadow-2xl backdrop-blur-xl rounded-2xl relative">
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Candidate Sign In
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Applicant Mode
              </span>
            </div>

            <form onSubmit={handleCandidateLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-cyan-400" />
                  <span>Candidate Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-cyan-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="alex.mercer@candidate.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Briefcase size={13} className="text-cyan-400" />
                  <span>Target Role or Specialty</span>
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Full-Stack Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <User size={16} />
                    <span>Enter Candidate Workspace</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Instant Demo Candidate Shortcut */}
            <div className="mt-5 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={handleQuickCandidateDemo}
                className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles size={14} className="text-cyan-400" />
                <span>1-Click Instant Candidate Access (Demo Mode)</span>
              </button>
            </div>

            {/* Candidate Access Scope */}
            <div className="mt-5 bg-surface-800/80 rounded-xl p-3.5 border border-white/[0.06] space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>Candidate Portal Features:</span>
              </p>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Brain size={12} className="text-cyan-400 shrink-0" />
                  <span>Live Conversational AI Interview Room</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Video size={12} className="text-cyan-400 shrink-0" />
                  <span>Recorded Practice Sessions & Eye-Gaze Tracking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart2 size={12} className="text-cyan-400 shrink-0" />
                  <span>Personal STAR Rubric & Speech Clarity Scorecards</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic pt-1 border-t border-white/5">
                * Note: Recruiter ATS screening and candidate comparison dashboards require administrator credentials.
              </p>
            </div>
          </div>

          {/* Prominent link to Admin Portal */}
          <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-sm">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
                <Lock size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Administrator or Recruiter?</p>
                <p className="text-[11px] text-slate-400">Access ATS resume screening & talent pipelines.</p>
              </div>
            </div>
            <Link
              to="/admin/login"
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shrink-0 flex items-center gap-1 shadow-sm"
            >
              <span>Admin Portal</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
