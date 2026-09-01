import React, { createContext, useContext, useState } from "react";
import { ClerkProvider, useAuth as useClerkAuth, useUser as useClerkUser, UserButton as ClerkUserButton } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export const isClerkConfigured = Boolean(
  PUBLISHABLE_KEY &&
  !PUBLISHABLE_KEY.includes("YOUR_CLERK_PUBLISHABLE_KEY") &&
  PUBLISHABLE_KEY.startsWith("pk_")
);

const DemoAuthContext = createContext(null);

export function AuthProvider({ children }) {
  if (isClerkConfigured) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        {children}
      </ClerkProvider>
    );
  }

  return <DemoAuthProvider>{children}</DemoAuthProvider>;
}

function DemoAuthProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(true);

  const value = {
    isLoaded: true,
    isSignedIn,
    userId: "demo_user",
    user: {
      id: "demo_user",
      firstName: "Demo",
      lastName: "Candidate",
      fullName: "Demo Candidate",
      primaryEmailAddress: { emailAddress: "candidate@debrief.ai" },
      imageUrl: null,
    },
    getToken: async () => "demo_mock_jwt_token",
    signOut: () => setIsSignedIn(false),
    signIn: () => setIsSignedIn(true),
    isDemo: true,
  };

  return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>;
}

export function useAppAuth() {
  if (isClerkConfigured) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const clerkAuth = useClerkAuth();
    return {
      ...clerkAuth,
      isDemo: false,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const demoAuth = useContext(DemoAuthContext);
  return demoAuth;
}

export function AppUserButton() {
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

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-700 border border-white/10 text-xs font-display">
      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-[10px]">
        DC
      </div>
      <span className="text-slate-300 font-medium hidden sm:inline">Demo Candidate</span>
      <span className="bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold">Demo</span>
    </div>
  );
}
