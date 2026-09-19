import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Sparkles,
  BarChart2,
  Users,
  FileText,
  Eye,
  AlertTriangle,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { useAppAuth } from "../context/AuthContext";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@debrief.ai");
  const [password, setPassword] = useState("••••••••••••");
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { loginAsAdmin } = useAppAuth();

  const handleAdminLogin = (e) => {
    if (e) e.preventDefault();
    setError("");
    setIsSubmitting(true);

    setTimeout(() => {
      loginAsAdmin(email || "admin@debrief.ai", "Debrief Administrator");
      setIsSubmitting(false);
      navigate("/recruiter");
    }, 400);
  };

  const handleQuickDemo = () => {
    loginAsAdmin("admin@debrief.ai", "Debrief Administrator");
    navigate("/recruiter");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-surface-950">
      {/* Admin ambient glowing backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full bg-purple-600/15 blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Top Header Badge */}
      <div className="relative z-10 flex flex-col items-center mb-8 text-center max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-5 backdrop-blur-md">
          <ShieldAlert size={14} className="text-purple-400" />
          <span>Restricted Enterprise Portal</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-[0_0_40px_rgba(147,51,234,0.4)] mb-4">
          <ShieldCheck size={32} className="text-white" />
        </div>

        <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-white mb-3">
          Admin & Recruiter <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">Console</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Authorized talent acquisition managers and system evaluators only. Grants complete visibility across ATS screening, candidate video proctoring, and pipeline telemetry.
        </p>
      </div>

      {/* Admin Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="card p-8 bg-surface-900/90 border border-purple-500/20 shadow-2xl backdrop-blur-xl rounded-2xl relative">
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Administrator Sign In
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Tier 1 Access
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail size={13} className="text-purple-400" />
                <span>Admin Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@debrief.ai"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock size={13} className="text-purple-400" />
                <span>Console Master Password</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound size={13} className="text-purple-400" />
                <span>Security Access Key <span className="text-slate-500 font-normal">(Optional for Demo)</span></span>
              </label>
              <input
                type="text"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="KEY-DEBRIEF-PRO-2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_0_25px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Authenticate & Enter Console</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Instant Demo Shortcut */}
          <div className="mt-5 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles size={14} className="text-purple-400" />
              <span>1-Click Instant Admin Access (Demo Viva Mode)</span>
            </button>
          </div>

          {/* Admin Permissions Checklist */}
          <div className="mt-5 bg-surface-800/80 rounded-xl p-3.5 border border-white/[0.06] space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <ShieldCheck size={13} />
              <span>Full Admin Powers Active Upon Login:</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
              <span className="flex items-center gap-1">✓ ATS Resume Screener</span>
              <span className="flex items-center gap-1">✓ Recruiter Leaderboard</span>
              <span className="flex items-center gap-1">✓ Anti-Cheat Telemetry</span>
              <span className="flex items-center gap-1">✓ Live Coding Face-off</span>
              <span className="flex items-center gap-1">✓ Webhooks Management</span>
              <span className="flex items-center gap-1">✓ Full Candidate Access</span>
            </div>
          </div>
        </div>

        {/* Link back to Candidate Portal */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <span>Are you an applicant or student practicing?</span>
            <span className="font-semibold text-cyan-400 hover:underline flex items-center">
              Go to Candidate Portal <ChevronRight size={13} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
