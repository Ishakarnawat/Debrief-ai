import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import UploadPage from "./pages/UploadPage";
import Dashboard from "./pages/Dashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import CandidateInvitePage from "./pages/CandidateInvitePage";
import LiveInterviewPage from "./pages/LiveInterviewPage";
import Navbar from "./components/Navbar";

/* ── Protected route wrapper ─────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAppAuth();
  if (!isLoaded) return <PageLoader />;
  if (!isSignedIn) return <Navigate to="/auth" replace />;
  return children;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/interview/:token"
          element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <CandidateInvitePage />
              </main>
            </div>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Navigate to="/live-interview" replace />} />
                    <Route path="/live-interview" element={<LiveInterviewPage />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/recruiter" element={<RecruiterDashboard />} />
                    <Route path="*" element={<Navigate to="/live-interview" replace />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
