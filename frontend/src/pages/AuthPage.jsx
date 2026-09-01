import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart2, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { isClerkConfigured, useAppAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("sign-in"); // "sign-in" | "sign-up"
  const navigate = useNavigate();
  const { signIn } = useAppAuth();

  const handleDemoSignIn = () => {
    if (signIn) signIn();
    navigate("/upload");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-brand-600/10 blur-[120px]" />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-[0_0_24px_rgba(79,110,247,0.6)]">
          <BarChart2 size={20} className="text-white" />
        </div>
        <span className="font-display font-bold text-2xl">
          Debrief<span className="text-brand-400">.ai</span>
        </span>
      </div>

      {/* Tagline */}
      <p className="text-slate-400 text-sm mb-8 text-center max-w-xs">
        Upload your interview audio. Get AI-powered coaching in seconds.
      </p>

      {isClerkConfigured ? (
        <>
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-surface-700 rounded-xl mb-6 border border-white/[0.06]">
            {["sign-in", "sign-up"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-5 py-2 rounded-lg text-sm font-display font-semibold transition-all duration-200
                  ${
                    mode === m
                      ? "bg-brand-500 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                {m === "sign-in" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Clerk component */}
          <div className="w-full max-w-md">
            {mode === "sign-in" ? (
              <SignIn
                routing="hash"
                redirectUrl="/upload"
                appearance={{
                  layout: { socialButtonsVariant: "iconButton", logoPlacement: "none" },
                  elements: {
                    card: "bg-surface-700 border border-white/[0.06] shadow-2xl rounded-2xl",
                    headerTitle: "font-display text-slate-100",
                    headerSubtitle: "text-slate-400",
                    socialButtonsIconButton: "border-white/10 hover:border-brand-500/50 bg-surface-600",
                    dividerLine: "bg-white/10",
                    dividerText: "text-slate-500",
                    formFieldInput: "bg-surface-800 border-white/10 text-slate-100 focus:border-brand-500 rounded-lg",
                    formFieldLabel: "text-slate-300 text-sm",
                    formButtonPrimary: "btn-primary w-full",
                    footerActionText: "text-slate-400",
                    footerActionLink: "text-brand-400 hover:text-brand-300",
                    identityPreviewText: "text-slate-300",
                    identityPreviewEditButton: "text-brand-400",
                  },
                }}
              />
            ) : (
              <SignUp
                routing="hash"
                redirectUrl="/upload"
                appearance={{
                  layout: { socialButtonsVariant: "iconButton", logoPlacement: "none" },
                  elements: {
                    card: "bg-surface-700 border border-white/[0.06] shadow-2xl rounded-2xl",
                    headerTitle: "font-display text-slate-100",
                    headerSubtitle: "text-slate-400",
                    socialButtonsIconButton: "border-white/10 hover:border-brand-500/50 bg-surface-600",
                    dividerLine: "bg-white/10",
                    dividerText: "text-slate-500",
                    formFieldInput: "bg-surface-800 border-white/10 text-slate-100 focus:border-brand-500 rounded-lg",
                    formFieldLabel: "text-slate-300 text-sm",
                    formButtonPrimary: "btn-primary w-full",
                    footerActionText: "text-slate-400",
                    footerActionLink: "text-brand-400 hover:text-brand-300",
                  },
                }}
              />
            )}
          </div>
        </>
      ) : (
        <div className="w-full max-w-md card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 mx-auto flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <h2 className="font-display font-bold text-xl text-white">Welcome to Debrief.ai</h2>
            <p className="text-slate-400 text-sm">
              Ready to test interview audio analysis with AI feedback.
            </p>
          </div>

          <div className="bg-surface-700/60 rounded-xl p-4 border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>Instant Demo Mode Active</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              No API keys required. You can record or upload audio to experience the full AI scoring, filler word analytics, and STAR framework analysis.
            </p>
          </div>

          <button
            onClick={handleDemoSignIn}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            <span>Start Practice (Demo Mode)</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
