import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import UploadPage from "./pages/UploadPage";
import Dashboard from "./pages/Dashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import CandidateInvitePage from "./pages/CandidateInvitePage";
import LiveInterviewPage from "./pages/LiveInterviewPage";
import ResumeScreenerPage from "./pages/ResumeScreenerPage";
import Navbar from "./components/Navbar";

/* ── Loading Spinner ─────────────────────────────────────────── */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-950">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/* ── General Protected Route (Candidate & Admin) ─────────────── */
function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAppAuth();
  if (!isLoaded) return <PageLoader />;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return children;
}

/* ── Admin-Only Protected Route ──────────────────────────────── */
function AdminRoute({ children }) {
  const { isLoaded, isSignedIn, isAdmin } = useAppAuth();
  if (!isLoaded) return <PageLoader />;
  if (!isSignedIn) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/unauthorized" replace />;
  return children;
}

/* ── Root Route Dispatcher ───────────────────────────────────── */
function RootDispatcher() {
  const { isLoaded, isSignedIn, isAdmin } = useAppAuth();
  if (!isLoaded) return <PageLoader />;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return isAdmin ? <Navigate to="/recruiter" replace /> : <Navigate to="/upload" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Candidate & Admin Login Pages ── */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />

        {/* ── Unauthorized / Access Denied Page ── */}
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex flex-col bg-surface-950">
              <Navbar />
              <main className="flex-1">
                <UnauthorizedPage />
              </main>
            </div>
          }
        />

        {/* ── Candidate Asynchronous Interview Portal ── */}
        <Route
          path="/interview/:token"
          element={
            <div className="min-h-screen flex flex-col bg-surface-950">
              <Navbar />
              <main className="flex-1">
                <CandidateInvitePage />
              </main>
            </div>
          }
        />

        {/* ── Authenticated App Pages ── */}
        <Route
          path="/*"
          element={
            <div className="min-h-screen flex flex-col bg-surface-950">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Root redirects based on role */}
                  <Route path="/" element={<RootDispatcher />} />

                  {/* Admin-Only Enterprise Pages */}
                  <Route
                    path="/recruiter"
                    element={
                      <AdminRoute>
                        <RecruiterDashboard />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/resume-screener"
                    element={
                      <AdminRoute>
                        <ResumeScreenerPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/recruiter/resume-screener"
                    element={
                      <AdminRoute>
                        <ResumeScreenerPage />
                      </AdminRoute>
                    }
                  />

                  {/* General Authenticated Pages (Available to Candidates & Admins) */}
                  <Route
                    path="/live-interview"
                    element={
                      <ProtectedRoute>
                        <LiveInterviewPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/upload"
                    element={
                      <ProtectedRoute>
                        <UploadPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<RootDispatcher />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
