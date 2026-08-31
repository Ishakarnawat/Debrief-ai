import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Mic, FileAudio, X, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useAnalyze } from "../hooks/useAnalyze";

const ACCEPTED = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/webm", "audio/ogg", "video/mp4"];

const STEPS = [
  "Uploading audio file...",
  "Transcribing with AI...",
  "Detecting filler words...",
  "Analyzing STAR method...",
  "Generating AI evaluation...",
  "Calculating hiring score...",
];

export default function UploadPage() {
  const navigate   = useNavigate();
  const inputRef   = useRef(null);
  const { analyze, loading, error } = useAnalyze();

  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [stepIdx, setStepIdx]   = useState(0);

  // ── File validation ──────────────────────────────────────────────────────
  const validateFile = (f) => {
    if (!ACCEPTED.includes(f.type)) return "Please upload an audio file (MP3, WAV, MP4, WebM)";
    if (f.size > 50 * 1024 * 1024) return "File too large — maximum 50 MB";
    return null;
  };

  const pickFile = (f) => {
    const err = validateFile(f);
    if (err) { alert(err); return; }
    setFile(f);
  };

  // ── Drag handlers ────────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!file) return;

    // Cycle through loading steps for UX feedback
    const interval = setInterval(() => {
      setStepIdx((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 2500);

    try {
      const result = await analyze(file);
      clearInterval(interval);
      // Pass result via navigation state so Dashboard can display it
      navigate("/dashboard", { state: { result } });
    } catch {
      clearInterval(interval);
      setStepIdx(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-5">
          <Mic size={13} className="text-brand-400" />
          <span className="text-xs font-display font-semibold text-brand-400 tracking-wider uppercase">
            AI Interview Coach
          </span>
        </div>
        <h1 className="font-display font-bold text-4xl text-white mb-3 tracking-tight">
          Upload Your Interview
        </h1>
        <p className="text-slate-400 text-base max-w-sm mx-auto">
          Drop an audio recording and get instant AI feedback on your performance.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !file && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4
          transition-all duration-300 cursor-pointer
          ${dragging
            ? "border-brand-500 bg-brand-500/10 scale-[1.01]"
            : file
            ? "border-emerald-500/40 bg-emerald-500/5 cursor-default"
            : "border-white/10 hover:border-brand-500/50 hover:bg-surface-700/50 bg-surface-700/30"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/mp4"
          className="hidden"
          onChange={(e) => e.target.files[0] && pickFile(e.target.files[0])}
        />

        {file ? (
          /* File selected state */
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <FileAudio size={28} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-white">{file.name}</p>
              <p className="text-slate-500 text-sm mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10
                         flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-slate-400" />
            </button>
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle size={15} />
              <span className="font-medium">Ready to analyze</span>
            </div>
          </>
        ) : (
          /* Empty drop zone */
          <>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
              ${dragging ? "bg-brand-500/20" : "bg-surface-600"}`}>
              <Upload size={26} className={dragging ? "text-brand-400" : "text-slate-500"} />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-slate-300">
                {dragging ? "Drop it here!" : "Drop audio file here"}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                or click to browse — MP3, WAV, MP4, WebM up to 50 MB
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading steps */}
      {loading && (
        <div className="mt-6 card-sm space-y-3">
          {STEPS.map((step, i) => (
            <div key={step} className={`flex items-center gap-3 text-sm transition-all duration-300
              ${i < stepIdx ? "text-emerald-400" : i === stepIdx ? "text-brand-400" : "text-slate-600"}`}>
              {i < stepIdx ? (
                <CheckCircle size={14} />
              ) : i === stepIdx ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-current opacity-30" />
              )}
              {step}
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {STEPS[stepIdx]}
          </>
        ) : (
          <>
            <Mic size={16} />
            Analyze Interview
          </>
        )}
      </button>

      {/* Tips */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { emoji: "🎙️", tip: "Clear audio improves accuracy" },
          { emoji: "⏱️",  tip: "30s – 5min clips work best" },
          { emoji: "🔒", tip: "Your data stays private" },
        ].map(({ emoji, tip }) => (
          <div key={tip} className="card-sm text-center">
            <div className="text-xl mb-1.5">{emoji}</div>
            <p className="text-slate-500 text-xs">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
