import { Link, useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { BarChart2, Upload, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { pathname } = useLocation();

  const links = [
    { to: "/upload",    label: "Analyze",   icon: Upload },
    { to: "/dashboard", label: "History",   icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/upload" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-[0_0_16px_rgba(79,110,247,0.5)]">
            <BarChart2 size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Debrief<span className="text-brand-400">.ai</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200
                ${pathname === to
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "bg-surface-700 border border-white/10",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
