import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Video,
  Briefcase,
  Building,
  User,
  Mail,
  HelpCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useRecruiter, useAnalyze } from "../hooks/useAnalyze";
import VideoRecorder from "../components/VideoRecorder";

export default function CandidateInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { fetchInvitationByToken } = useRecruiter();
  const { analyze, loading: isSubmitting, error: submitError } = useAnalyze();

  const [invitation, setInvitation] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState("");

  // Candidate input
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [file, setFile] = useState(null);
  const [proctoringData, setProctoringData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoadingInvite(true);
        const data = await fetchInvitationByToken(token);
        setInvitation(data);
        if (data.candidateEmail) setCandidateEmail(data.candidateEmail);
      } catch (err) {
        setInviteError(err.message || "Invalid or expired interview link.");
      } finally {
        setLoadingInvite(false);
      }
    }
    load();
  }, [token]);

  const handleVideoRecorded = (videoFile, duration, pData) => {
    setFile(videoFile);
    if (pData) setProctoringData(pData);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please record your interview answer before submitting.");
      return;
    }
    if (!candidateName.trim() || !candidateEmail.trim()) {
      alert("Please enter your name and email address before submitting.");
      return;
    }

    try {
      const metadata = {
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        targetRole: invitation?.role || "Software Engineer",
        question: invitation?.questions?.[0] || "Interview Question",
        mediaType: "video",
        invitationToken: token,
        proctoringData,
      };

      const result = await analyze(file, metadata);
      setResultData(result);
      setIsCompleted(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingInvite) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs">Loading proctored interview session...</p>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 card bg-surface-900 border border-red-500/30 rounded-2xl text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-white font-display font-bold text-xl">Invalid Interview Link</h2>
        <p className="text-slate-400 text-xs">{inviteError}</p>
        <button onClick={() => navigate("/upload")} className="btn-primary text-xs py-2 px-4">
          Return to Debrief.ai
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 card bg-surface-900 border border-emerald-500/30 rounded-2xl text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 size={36} />
        </div>
        <div>
          <h2 className="text-white font-display font-bold text-2xl">Interview Submitted Successfully!</h2>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Thank you, <span className="text-white font-semibold">{candidateName}</span>. Your video response and proctoring telemetry have been sent directly to the hiring team at{" "}
            <span className="text-brand-300 font-semibold">{invitation?.companyName || "the hiring team"}</span>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-800/80 border border-white/5 text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Candidate Name:</span>
            <span className="text-white font-medium">{candidateName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Position:</span>
            <span className="text-white font-medium">{invitation?.role}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Anti-Cheat Integrity:</span>
            <span className="text-emerald-400 font-mono font-bold">
              {proctoringData?.integrityScore ?? 100}% Verified
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => navigate("/dashboard", { state: { result: resultData } })}
            className="btn-primary text-xs py-2.5 px-6 rounded-xl shadow-lg"
          >
            View Your Instant Performance Debrief
          </button>
        </div>
      </div>
    );
  }

  const primaryQuestion =
    invitation?.questions?.[0] || "Tell me about a time you solved a major technical bottleneck.";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in space-y-6">
      {/* Invitation Header Banner */}
      <div className="card p-6 bg-surface-800/90 border border-white/[0.08] rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Building size={16} className="text-brand-400" />
            <span className="font-semibold text-white text-sm">
              {invitation?.companyName || "Debrief.ai Partner"}
            </span>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/20">
            Official Candidate Screening
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="font-display font-bold text-2xl text-white">
            Interview Assessment for {invitation?.role}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Please record your response to the prompt below. Ensure your camera is centered in good lighting.
          </p>
        </div>

        {/* Anti-Cheat Compliance Alert */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
          <Shield size={16} className="shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-0.5">
            <span className="font-semibold block uppercase tracking-wider text-[10px]">
              AI Proctoring Guard Enabled
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              This session is monitored for integrity. Switching browser tabs, minimizing the window, or having multiple faces in frame will be logged on the recruiter audit timeline.
            </p>
          </div>
        </div>
      </div>

      {/* Candidate Profile Details */}
      <div className="card p-5 bg-surface-800/80 border border-white/[0.08] rounded-2xl space-y-4">
        <div className="text-xs font-semibold text-white uppercase tracking-wider">
          1. Candidate Information
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
              className="w-full bg-surface-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail size={13} className="text-slate-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              placeholder="e.g. alex.morgan@email.com"
              required
              className="w-full bg-surface-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Question Prompt Card */}
      <div className="p-4 rounded-xl bg-surface-800/90 border border-brand-500/20 flex items-start gap-3">
        <HelpCircle size={18} className="text-brand-400 mt-0.5 shrink-0" />
        <div>
          <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider block mb-0.5">
            Interview Question Prompt
          </span>
          <p className="text-white text-sm font-medium">{primaryQuestion}</p>
        </div>
      </div>

      {/* Video Recorder */}
      <div className="space-y-4">
        <div className="text-xs font-semibold text-white uppercase tracking-wider">
          2. Live Video Recording
        </div>
        <VideoRecorder
          onRecorded={handleVideoRecorded}
          currentQuestion={primaryQuestion}
          isProctoringEnabled={true}
        />

        {submitError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{submitError}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!file || isSubmitting}
          className="btn-primary w-full py-3.5 text-sm font-semibold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Transcribing & Verifying Proctoring Integrity...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Submit Proctored Assessment to Recruiter</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
