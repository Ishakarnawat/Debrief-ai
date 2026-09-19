import { ShieldAlert, ArrowLeft, Lock, ArrowRight, ArrowRightLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppAuth } from "../context/AuthContext";

export default function UnauthorizedPage() {
  const { user, switchRole } = useAppAuth();
  const navigate = useNavigate();

  const handleSwitchToAdmin = () => {
    switchRole("admin");
    navigate("/recruiter");
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full bg-red-500/10 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-md w-full card p-8 bg-surface-900/90 border border-red-500/30 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <ShieldAlert size={34} />
        </div>

        <span className="inline-block text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 mb-3">
          403 Access Restricted
        </span>

        <h1 className="font-display font-extrabold text-2xl text-white mb-2">
          Administrator Privileges Required
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          You are currently signed in as <strong className="text-cyan-300">{user?.fullName || "Candidate"}</strong>. This portal (ATS Resume Screener & Recruiter Leaderboard) is restricted to hiring administrators.
        </p>

        <div className="space-y-2.5">
          <button
            onClick={handleSwitchToAdmin}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-600/30"
          >
            <ArrowRightLeft size={14} />
            <span>Switch to Admin Mode (Demo Viva)</span>
          </button>

          <Link
            to="/admin/login"
            className="w-full py-2.5 px-4 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all block"
          >
            <Lock size={14} className="text-purple-400" />
            <span>Sign In to Admin Console</span>
          </Link>

          <Link
            to="/upload"
            className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all block"
          >
            <ArrowLeft size={14} />
            <span>Return to Candidate Practice Area</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
