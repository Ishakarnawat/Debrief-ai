import { Link, useLocation } from "react-router-dom";
import { AppUserButton } from "../context/AuthContext";
import { BarChart2, Upload, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { pathname } = useLocation();

  const links = [
    { to: "/upload", label: "Analyze", icon: Upload },
    { to: "/dashboard", label: "History", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/upload" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-[0_0_16px_rgba(79,110,247,0.5)]">
            <BarChart2 size={16} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg tracking-tight">
              Debrief<span className="text-brand-400">.ai</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Pro Screening
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <Link
            to="/upload"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              pathname === "/upload"
                ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Upload size={14} />
            <span>Interview Session</span>
          </Link>

          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              pathname === "/dashboard"
                ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <LayoutDashboard size={14} />
            <span>Candidate Records</span>
          </Link>
        </nav>

        {/* User */}
        <div className="flex items-center gap-3">
          <AppUserButton />
        </div>
      </div>
    </header>
  );
}
