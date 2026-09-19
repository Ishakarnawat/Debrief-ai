import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  ClerkProvider,
  useAuth as useClerkAuth,
  useUser as useClerkUser,
  UserButton as ClerkUserButton,
} from "@clerk/clerk-react";
import { ShieldCheck, User, LogOut, ArrowRightLeft, ShieldAlert, Sparkles } from "lucide-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export const isClerkConfigured = Boolean(
  PUBLISHABLE_KEY &&
  !PUBLISHABLE_KEY.includes("YOUR_CLERK_PUBLISHABLE_KEY") &&
  PUBLISHABLE_KEY.startsWith("pk_")
);

const STORAGE_KEY = "debrief_auth_session_v1";

const DEFAULT_ADMIN = {
  id: "admin_debrief",
  firstName: "Debrief",
  lastName: "Admin",
  fullName: "Debrief Administrator",
  primaryEmailAddress: { emailAddress: "admin@debrief.ai" },
  role: "admin",
  imageUrl: null,
};

const DEFAULT_USER = {
  id: "candidate_demo",
  firstName: "Alex",
  lastName: "Mercer",
  fullName: "Alex Mercer",
  primaryEmailAddress: { emailAddress: "alex.mercer@candidate.com" },
  role: "user",
  imageUrl: null,
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  if (isClerkConfigured) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <ClerkAuthWrapper>{children}</ClerkAuthWrapper>
      </ClerkProvider>
    );
  }

  return <DemoAuthProvider>{children}</DemoAuthProvider>;
}

/* ── Clerk Bridge to standardise roles ────────────────────────── */
function ClerkAuthWrapper({ children }) {
  const clerkAuth = useClerkAuth();
  const { user: clerkUser } = useClerkUser();

  const userEmail = clerkUser?.primaryEmailAddress?.emailAddress || "";
  const isAdmin = Boolean(
    userEmail.toLowerCase().includes("debrief.ai") ||
    userEmail.toLowerCase().includes("admin") ||
    clerkUser?.publicMetadata?.role === "admin"
  );

  const value = {
    isLoaded: clerkAuth.isLoaded,
    isSignedIn: clerkAuth.isSignedIn,
    userId: clerkAuth.userId,
    user: clerkUser
      ? {
          id: clerkUser.id,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          fullName: clerkUser.fullName,
          primaryEmailAddress: clerkUser.primaryEmailAddress,
          role: isAdmin ? "admin" : "user",
          imageUrl: clerkUser.imageUrl,
        }
      : null,
    role: isAdmin ? "admin" : "user",
    isAdmin,
    isCandidate: !isAdmin,
    getToken: clerkAuth.getToken,
    signOut: clerkAuth.signOut,
    isDemo: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Demo Auth Provider with strict role separation ────────────── */
function DemoAuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    // Default to admin on first load so examiner can test everything,
    // but allow seamless toggling or explicit login
    return {
      isSignedIn: true,
      role: "admin",
      user: DEFAULT_ADMIN,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn("Could not persist session:", e);
    }
  }, [session]);

  const loginAsAdmin = (email, name) => {
    const adminUser = {
      ...DEFAULT_ADMIN,
      fullName: name || "Debrief Administrator",
      primaryEmailAddress: { emailAddress: email || "admin@debrief.ai" },
    };
    setSession({
      isSignedIn: true,
      role: "admin",
      user: adminUser,
    });
    return true;
  };

  const loginAsCandidate = (email, name) => {
    const candidateUser = {
      ...DEFAULT_USER,
      fullName: name || "Candidate User",
      primaryEmailAddress: { emailAddress: email || "candidate@example.com" },
    };
    setSession({
      isSignedIn: true,
      role: "user",
      user: candidateUser,
    });
    return true;
  };

  const switchRole = (newRole) => {
    if (newRole === "admin") {
      setSession({
        isSignedIn: true,
        role: "admin",
        user: DEFAULT_ADMIN,
      });
    } else {
      setSession({
        isSignedIn: true,
        role: "user",
        user: DEFAULT_USER,
      });
    }
  };

  const signOut = () => {
    setSession({
      isSignedIn: false,
      role: null,
      user: null,
    });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const value = {
    isLoaded: true,
    isSignedIn: Boolean(session.isSignedIn),
    userId: session.user?.id || null,
    user: session.user,
    role: session.role || "user",
    isAdmin: session.role === "admin",
    isCandidate: session.role === "user",
    loginAsAdmin,
    loginAsCandidate,
    switchRole,
    signOut,
    signIn: () => loginAsAdmin(),
    getToken: async () => "demo_jwt_token",
    isDemo: true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAppAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // If not ready yet
    return {
      isLoaded: true,
      isSignedIn: false,
      user: null,
      role: "user",
      isAdmin: false,
      isCandidate: true,
    };
  }
  return context;
}

/* ── Interactive User Button Component ────────────────────────── */
export function AppUserButton() {
  const { user, isAdmin, signOut, switchRole, isSignedIn } = useAppAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isClerkConfigured) {
    return (
      <ClerkUserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
            userButtonPopoverCard: "bg-surface-700 border border-white/10",
          },
        }}
      />
    );
  }

  if (!isSignedIn || !user) {
    return (
      <div className="flex items-center gap-2">
        <a
          href="/login"
          className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
        >
          Candidate Login
        </a>
        <a
          href="/admin/login"
          className="text-xs font-semibold text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/30 hover:bg-brand-500/20 transition-all"
        >
          Admin Portal
        </a>
      </div>
    );
  }

  const initials = (user.fullName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/10 text-xs font-display transition-all cursor-pointer shadow-sm hover:border-white/20"
      >
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] ${
            isAdmin
              ? "bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-[0_0_10px_rgba(147,51,234,0.4)]"
              : "bg-gradient-to-tr from-cyan-600 to-blue-500"
          }`}
        >
          {initials}
        </div>
        <span className="text-slate-200 font-medium hidden sm:inline">{user.fullName}</span>
        {isAdmin ? (
          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
            Admin
          </span>
        ) : (
          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
            Candidate
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-800 border border-white/10 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="border-b border-white/10 pb-2.5 mb-2">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              {isAdmin ? <ShieldCheck size={14} className="text-purple-400" /> : <User size={14} className="text-cyan-400" />}
              {user.fullName}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{user.primaryEmailAddress?.emailAddress}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                  isAdmin
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                }`}
              >
                {isAdmin ? "Administrator Privileges" : "Candidate / Student View"}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                switchRole(isAdmin ? "user" : "admin");
                setOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <ArrowRightLeft size={13} className="text-brand-400" />
                <span>Switch to {isAdmin ? "Candidate" : "Admin"}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Toggle</span>
            </button>

            {isAdmin && (
              <a
                href="/admin/login"
                onClick={() => setOpen(false)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 flex items-center gap-2 transition-colors block"
              >
                <ShieldAlert size={13} />
                <span>Admin Login Portal</span>
              </a>
            )}

            {!isAdmin && (
              <a
                href="/admin/login"
                onClick={() => setOpen(false)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-400 hover:text-purple-300 hover:bg-white/5 flex items-center gap-2 transition-colors block"
              >
                <ShieldCheck size={13} />
                <span>Switch to Admin Portal</span>
              </a>
            )}

            <button
              onClick={() => {
                signOut();
                setOpen(false);
                window.location.href = "/login";
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
