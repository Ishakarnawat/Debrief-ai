import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Mic,
  Square,
  FileAudio,
  FileVideo,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  Play,
  Video,
  User,
  Briefcase,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useAnalyze } from "../hooks/useAnalyze";
import VideoRecorder from "../components/VideoRecorder";

const ACCEPTED = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const PRESET_QUESTIONS = [
  "Tell me about a time you solved a major technical bottleneck.",
  "Describe a situation where you had to lead through uncertainty.",
  "How do you handle disagreement with a senior engineer or team lead?",
  "Walk me through your most complex architectural decision.",
  "Explain a high-severity production outage and how you resolved it.",
];

const STEPS = [
  "Processing candidate response stream...",
  "Transcribing audio with Whisper AI...",
  "Analyzing speech cadence & filler words...",
  "Evaluating STAR framework (Situation, Task, Action, Result)...",
  "Scoring technical depth and communication clarity...",
  "Calculating hiring probability & generating debrief...",
];

export default function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { analyze, loading, error } = useAnalyze();

  // Mode Selection: "video" | "audio" | "upload"
  const [activeTab, setActiveTab] = useState("video");

  // Screening Metadata
  const [candidateName, setCandidateName] = useState("Alex Morgan");
  const [targetRole, setTargetRole] = useState("Full Stack Software Engineer");
  const [selectedQuestion, setSelectedQuestion] = useState(PRESET_QUESTIONS[0]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [isCustomQ, setIsCustomQ] = useState(false);

  // File state (from video recording, audio recording, or dropzone)
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState("video");
  const [recordDuration, setRecordDuration] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  // Live Audio-only Recording State
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioMediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    };
  }, []);

  const currentActiveQuestion = isCustomQ && customQuestion.trim() ? customQuestion : selectedQuestion;

  // ─── File Validation ────────────────────────────────────────────────────────
  const validateFile = (f) => {
    const isAudio = f.type.startsWith("audio/") || ACCEPTED.includes(f.type);
    const isVideo = f.type.startsWith("video/") || ACCEPTED.includes(f.type);

    if (!isAudio && !isVideo) {
      return "Please upload an audio or video file (MP3, WAV, WebM, MP4)";
    }
    if (f.size > 100 * 1024 * 1024) return "File too large — maximum 100 MB";
    return null;
  };

  const pickFile = (f) => {
    const err = validateFile(f);
    if (err) {
      alert(err);
      return;
    }
    setFile(f);
    setMediaType(f.type.startsWith("video/") ? "video" : "audio");
  };

  // ─── Callback from VideoRecorder Component ─────────────────────────────────
  const handleVideoRecorded = (videoFile, duration) => {
    setFile(videoFile);
    setMediaType("video");
    setRecordDuration(duration);
  };

  // ─── Audio-only live recording ─────────────────────────────────────────────
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      audioMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const recordedFile = new File([audioBlob], `interview-audio-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setFile(recordedFile);
        setMediaType("audio");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsAudioRecording(true);
      setAudioDuration(0);

      audioTimerRef.current = setInterval(() => {
        setAudioDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone access denied or not available. You can also upload a file directly.");
    }
  };

  const stopAudioRecording = () => {
    if (audioMediaRecorderRef.current && isAudioRecording) {
      audioMediaRecorderRef.current.stop();
      setIsAudioRecording(false);
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    }
  };

  // ─── Quick Sample Loader ───────────────────────────────────────────────────
  const loadSample = (sampleType) => {
    const sampleTitle =
      sampleType === "eng" ? "Sample Engineering STAR Response" : "Sample Technical Leadership Response";
    const blob = new Blob(["RIFF....WAVEfmt ....data...."], { type: "audio/wav" });
    const sampleFile = new File([blob], `${sampleTitle}.wav`, { type: "audio/wav" });
    setFile(sampleFile);
    setMediaType("audio");
  };

  // ─── Drag & Drop ───────────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  // ─── Submit & Analyze ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!file) return;

    const interval = setInterval(() => {
      setStepIdx((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 2500);

    try {
      const metadata = {
        candidateName,
        targetRole,
        question: currentActiveQuestion,
        mediaType,
      };

      const result = await analyze(file, metadata);
      clearInterval(interval);
      navigate("/dashboard", { state: { result } });
    } catch {
      clearInterval(interval);
      setStepIdx(0);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in space-y-8">
      {/* Top Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 shadow-sm">
          <Sparkles size={14} className="text-brand-400" />
          <span className="text-xs font-display font-semibold text-brand-400 tracking-wider uppercase">
            Enterprise AI Screening & Video Interview
          </span>
        </div>
        <h1 className="font-display font-bold text-4xl text-white tracking-tight">
          Candidate Interview Assessment
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Record your video interview session with live camera analytics, or upload a recorded response for instant STAR scoring and hiring readiness evaluation.
        </p>
      </div>

      {/* Candidate & Interview Details Card */}
      <div className="card p-6 bg-surface-800/80 border border-white/[0.08] backdrop-blur-md rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2 text-white font-display font-semibold text-sm">
            <ShieldCheck size={16} className="text-brand-400" />
            <span>Interview Session Context</span>
          </div>
          <span className="text-xs text-slate-400 bg-surface-700 px-2.5 py-1 rounded-lg border border-white/5">
            Phase 1 • Video AI Active
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              <span>Candidate Name</span>
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full bg-surface-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase size={13} className="text-slate-400" />
              <span>Target Role</span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full bg-surface-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <HelpCircle size={13} className="text-slate-400" />
            <span>Interview Question Prompt</span>
          </label>
          <div className="space-y-2">
            <div className="relative">
              <select
                disabled={isCustomQ}
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value)}
                className={`w-full bg-surface-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-brand-500 transition-colors ${
                  isCustomQ ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                {PRESET_QUESTIONS.map((q) => (
                  <option key={q} value={q} className="bg-surface-900 text-white">
                    {q}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="customQ"
                checked={isCustomQ}
                onChange={(e) => setIsCustomQ(e.target.checked)}
                className="rounded border-white/20 bg-surface-900 text-brand-500 focus:ring-brand-500 h-4 w-4"
              />
              <label htmlFor="customQ" className="text-xs text-slate-400 cursor-pointer">
                Enter a custom question
              </label>
            </div>

            {isCustomQ && (
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Type your custom interview question here..."
                className="w-full bg-surface-900 border border-brand-500/50 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors animate-fade-in"
              />
            )}
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1.5 bg-surface-900/90 rounded-2xl border border-white/10 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab("video");
            setFile(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "video"
              ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Video size={15} />
          <span>Video Interview</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("audio");
            setFile(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "audio"
              ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Mic size={15} />
          <span>Audio Only</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("upload");
            setFile(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "upload"
              ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Upload size={15} />
          <span>File Upload</span>
        </button>
      </div>

      {/* Main Interaction Area */}
      <div className="card p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl rounded-2xl">
        {/* TAB 1: Live Video Interview */}
        {activeTab === "video" && (
          <div className="space-y-4">
            <VideoRecorder
              onRecorded={handleVideoRecorded}
              currentQuestion={currentActiveQuestion}
            />
            {file && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle size={16} />
                  <span>Video response captured successfully ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
                <span className="font-semibold text-emerald-300">Ready for AI</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Live Audio Recording */}
        {activeTab === "audio" && (
          <div className="p-8 rounded-2xl bg-surface-900 border border-white/10 text-center space-y-6">
            <div
              className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center transition-all ${
                isAudioRecording
                  ? "bg-red-500 text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.7)]"
                  : "bg-brand-500/15 text-brand-400"
              }`}
            >
              <Mic size={36} />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-semibold text-lg text-white">
                {isAudioRecording ? "Recording Audio Response..." : "Microphone Ready"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAudioRecording
                  ? `Elapsed Time: ${formatTimer(audioDuration)} • Speak clearly into your mic`
                  : "Click start to begin recording your spoken answer"}
              </p>
            </div>

            <div>
              {!isAudioRecording ? (
                <button
                  type="button"
                  onClick={startAudioRecording}
                  className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-lg shadow-brand-500/30"
                >
                  <Mic size={16} />
                  <span>Start Audio Recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopAudioRecording}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-lg shadow-red-500/40 animate-pulse"
                >
                  <Square size={16} />
                  <span>Stop & Lock In Answer ({formatTimer(audioDuration)})</span>
                </button>
              )}
            </div>

            {file && !isAudioRecording && (
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-medium pt-2">
                <CheckCircle size={15} />
                <span>Audio recording ready ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: File Upload */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => !file && inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 transition-all duration-300 cursor-pointer ${
                dragging
                  ? "border-brand-500 bg-brand-500/10 scale-[1.01]"
                  : file
                  ? "border-emerald-500/40 bg-emerald-500/5 cursor-default"
                  : "border-white/10 hover:border-brand-500/50 hover:bg-surface-700/50 bg-surface-700/30"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="audio/*,video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => e.target.files[0] && pickFile(e.target.files[0])}
              />

              {file ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                    {mediaType === "video" ? (
                      <FileVideo size={28} className="text-emerald-400" />
                    ) : (
                      <FileAudio size={28} className="text-emerald-400" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-display font-semibold text-white">{file.name}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {mediaType.toUpperCase()} Ready
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X size={14} className="text-slate-400" />
                  </button>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                    <CheckCircle size={15} />
                    <span>Media Loaded & Ready for AI Evaluation</span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                      dragging ? "bg-brand-500/20" : "bg-surface-600"
                    }`}
                  >
                    <Upload size={26} className={dragging ? "text-brand-400" : "text-slate-500"} />
                  </div>
                  <div className="text-center">
                    <p className="font-display font-semibold text-slate-300 text-sm">
                      {dragging ? "Drop it here!" : "Drop audio or video file here"}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      or click to browse — MP4, WebM, MP3, WAV up to 100 MB
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Quick Sample Triggers */}
            {!file && (
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles size={13} className="text-brand-400" />
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Or try a 1-click sample answer:
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => loadSample("eng")}
                    className="p-3 rounded-xl bg-surface-700/40 hover:bg-brand-500/10 border border-white/[0.06] hover:border-brand-500/30 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 text-white font-medium text-xs mb-0.5">
                      <Play size={11} className="text-brand-400 group-hover:translate-x-0.5 transition-transform" />
                      <span>Engineering Bottleneck (STAR)</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Deploy pipeline optimization & tech leadership</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadSample("lead")}
                    className="p-3 rounded-xl bg-surface-700/40 hover:bg-brand-500/10 border border-white/[0.06] hover:border-brand-500/30 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 text-white font-medium text-xs mb-0.5">
                      <Play size={11} className="text-brand-400 group-hover:translate-x-0.5 transition-transform" />
                      <span>Customer Retention Challenge</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Onboarding drop-off & product metrics</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-400 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {/* Loading progression steps */}
        {loading && (
          <div className="card-sm space-y-2.5 bg-surface-900 border border-brand-500/20 p-4 rounded-xl">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={`flex items-center gap-3 text-xs transition-all duration-300 ${
                  i < stepIdx
                    ? "text-emerald-400 font-medium"
                    : i === stepIdx
                    ? "text-brand-400 font-semibold"
                    : "text-slate-600"
                }`}
              >
                {i < stepIdx ? (
                  <CheckCircle size={14} />
                ) : i === stepIdx ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-current opacity-30" />
                )}
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!file || loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{STEPS[stepIdx]}</span>
            </>
          ) : (
            <>
              <Sparkles size={17} />
              <span>Submit & Analyze Assessment</span>
            </>
          )}
        </button>
      </div>

      {/* Feature Highlights Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { emoji: "📹", title: "Video Camera HUD", tip: "Record live answers with browser WebRTC" },
          { emoji: "⭐", title: "STAR Evaluation", tip: "Situation, Task, Action, Result analysis" },
          { emoji: "🛡️", title: "Recruiter Ready", tip: "Generates structured scores & hiring metric" },
        ].map(({ emoji, title, tip }) => (
          <div key={title} className="card-sm p-3.5 bg-surface-800/60 border border-white/5 rounded-xl text-center">
            <div className="text-lg mb-1">{emoji}</div>
            <div className="text-white font-medium text-xs">{title}</div>
            <p className="text-slate-500 text-[11px] mt-0.5">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
