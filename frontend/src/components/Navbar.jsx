import { Link, useLocation } from "react-router-dom";
import { AppUserButton, useAppAuth } from "../context/AuthContext";
import {
  BarChart2,
  Upload,
  LayoutDashboard,
  Brain,
  FileText,
  ShieldCheck,
  User,
  Lock,
  ChevronRight
} from "lucide-react";

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, isAdmin, isSignedIn } = useAppAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={isAdmin ? "/recruiter" : "/upload"}
          className="flex items-center gap-2.5 group"
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isAdmin
                ? "bg-purple-600 shadow-[0_0_16px_rgba(147,51,234,0.5)]"
                : "bg-cyan-600 shadow-[0_0_16px_rgba(6,182,212,0.5)]"
            }`}
          >
            {isAdmin ? <BarChart2 size={16} className="text-white" /> : <Brain size={16} className="text-white" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg tracking-tight">
              Debrief<span className={isAdmin ? "text-purple-400" : "text-cyan-400"}>.ai</span>
            </span>
            {isAdmin ? (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <ShieldCheck size={11} />
                <span>Admin Console</span>
              </span>
            ) : (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <User size={11} />
                <span>Candidate View</span>
              </span>
            )}
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {/* Admin-Exclusive Links */}
          {isAdmin && (
            <>
              <Link
                to="/recruiter"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  pathname === "/recruiter"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <BarChart2 size={14} className="text-purple-400" />
                <span>Recruiter Portal</span>
              </Link>

              <Link
                to="/resume-screener"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  pathname === "/resume-screener" || pathname === "/recruiter/resume-screener"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <FileText size={14} className="text-purple-400" />
                <span>ATS Screener</span>
              </Link>
            </>
          )}

          {/* Links available to all authenticated users */}
          <Link
            to="/live-interview"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              pathname === "/live-interview"
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Brain size={14} className="text-violet-400" />
            <span>Live AI Room</span>
          </Link>

          <Link
            to="/upload"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              pathname === "/upload"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Upload size={14} />
            <span>Practice Session</span>
          </Link>

          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              pathname === "/dashboard"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <LayoutDashboard size={14} />
            <span>{isAdmin ? "Assessments Audit" : "My Assessments"}</span>
          </Link>
        </nav>

        {/* User Button & Switcher */}
        <div className="flex items-center gap-2.5">
          {!isAdmin && isSignedIn && (
            <Link
              to="/admin/login"
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
              title="Switch to Admin / Recruiter Login"
            >
              <Lock size={12} />
              <span>Admin Portal</span>
            </Link>
          )}

          <AppUserButton />
        </div>
      </div>
    </header>
  );
}
