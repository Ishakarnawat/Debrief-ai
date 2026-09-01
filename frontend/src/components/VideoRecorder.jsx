import { useState, useRef, useEffect, useCallback } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Square,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Camera,
  Pause,
} from "lucide-react";

export default function VideoRecorder({ onRecorded, currentQuestion }) {
  const videoPreviewRef = useRef(null);
  const playbackRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // States
  const [permissionGranted, setPermissionGranted] = useState(null); // null, true, false
  const [permissionError, setPermissionError] = useState("");
  const [status, setStatus] = useState("initializing"); // initializing, ready, recording, paused, preview
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // ─── Initialize Camera & Mic Stream ─────────────────────────────────────────
  const initMediaStream = useCallback(async () => {
    try {
      setStatus("initializing");
      setPermissionError("");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera recording is not supported in this browser.");
      }

      // Stop any existing stream tracks first
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: true,
      });

      mediaStreamRef.current = stream;
      setPermissionGranted(true);
      setStatus("ready");

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setPermissionGranted(false);
      setStatus("ready");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionError("Camera & Microphone permissions were denied. Please allow browser access to record.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setPermissionError("No camera or microphone found on this device.");
      } else {
        setPermissionError(err.message || "Failed to access camera.");
      }
    }
  }, []);

  useEffect(() => {
    initMediaStream();
    return () => {
      // Clean up stream on unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [initMediaStream]);

  // Connect video stream to preview element when ready
  useEffect(() => {
    if (status !== "preview" && videoPreviewRef.current && mediaStreamRef.current) {
      videoPreviewRef.current.srcObject = mediaStreamRef.current;
    }
  }, [status]);

  // ─── Toggle Camera / Mic Mute ──────────────────────────────────────────────
  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!audioTracks[0]?.enabled);
    }
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!videoTracks[0]?.enabled);
    }
  };

  // ─── Recording Controls ───────────────────────────────────────────────────
  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];

    // Determine supported mime type
    let mimeType = "video/webm;codecs=vp9,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/mp4";
        }
      }
    }

    const options = mimeType ? { mimeType } : {};
    const recorder = new MediaRecorder(mediaStreamRef.current, options);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blobType = mimeType.split(";")[0] || "video/webm";
      const recordedBlob = new Blob(recordedChunksRef.current, { type: blobType });
      const videoFile = new File(
        [recordedBlob],
        `interview-video-${Date.now()}.${blobType.includes("mp4") ? "mp4" : "webm"}`,
        { type: blobType }
      );

      const url = URL.createObjectURL(recordedBlob);
      setRecordedBlobUrl(url);
      setStatus("preview");

      if (onRecorded) {
        onRecorded(videoFile, recordSeconds);
      }
    };

    recorder.start(250); // Emit slice every 250ms
    setStatus("recording");
    setRecordSeconds(0);

    timerIntervalRef.current = setInterval(() => {
      setRecordSeconds((prev) => prev + 1);
    }, 1000);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
      clearInterval(timerIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && status === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (status === "recording" || status === "paused")) {
      mediaRecorderRef.current.stop();
      clearInterval(timerIntervalRef.current);
    }
  };

  const retakeVideo = () => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlobUrl(null);
    setRecordSeconds(0);
    setStatus("ready");
    if (onRecorded) {
      onRecorded(null, 0);
    }
  };

  // Helper formatting for seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl">
      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "recording" && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]" />
              <span>REC {formatTime(recordSeconds)}</span>
            </div>
          )}
          {status === "paused" && (
            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full">
              <Pause size={12} />
              <span>PAUSED ({formatTime(recordSeconds)})</span>
            </div>
          )}
          {status === "ready" && (
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>CAMERA LIVE</span>
            </div>
          )}
          {status === "preview" && (
            <div className="flex items-center gap-2 bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs font-semibold px-3 py-1 rounded-full">
              <CheckCircle2 size={13} />
              <span>RECORDED ({formatTime(recordSeconds)})</span>
            </div>
          )}
        </div>

        {/* Live Question Prompt Overlay */}
        {currentQuestion && status !== "preview" && (
          <div className="hidden sm:block max-w-sm truncate text-center text-xs text-slate-200 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
            <span className="text-brand-400 font-semibold mr-1">Q:</span>
            {currentQuestion}
          </div>
        )}

        {/* Hardware Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMute}
            disabled={status === "preview"}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            className={`p-2 rounded-lg text-xs transition-colors backdrop-blur-md ${
              isMuted
                ? "bg-red-500/30 text-red-300 border border-red-500/50"
                : "bg-black/50 text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <button
            type="button"
            onClick={toggleVideo}
            disabled={status === "preview"}
            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
            className={`p-2 rounded-lg text-xs transition-colors backdrop-blur-md ${
              isVideoOff
                ? "bg-red-500/30 text-red-300 border border-red-500/50"
                : "bg-black/50 text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            {isVideoOff ? <VideoOff size={15} /> : <Video size={15} />}
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative w-full aspect-video min-h-[320px] max-h-[460px] bg-slate-900 flex items-center justify-center">
        {permissionGranted === false ? (
          <div className="p-8 text-center max-w-md">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-white font-display font-semibold text-lg mb-2">Camera Access Required</h3>
            <p className="text-slate-400 text-sm mb-5">{permissionError}</p>
            <button
              type="button"
              onClick={initMediaStream}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs inline-flex items-center gap-2 transition-all shadow-lg"
            >
              <Camera size={14} />
              <span>Retry Camera Permission</span>
            </button>
          </div>
        ) : status === "preview" ? (
          <video
            ref={playbackRef}
            src={recordedBlobUrl}
            controls
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                isVideoOff ? "hidden" : "block"
              }`}
            />
            {isVideoOff && (
              <div className="text-center p-6">
                <VideoOff size={36} className="mx-auto text-slate-600 mb-2" />
                <p className="text-slate-400 text-sm">Camera preview is paused</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="p-4 bg-surface-800/90 backdrop-blur-md border-t border-white/[0.08] flex items-center justify-between gap-4">
        <div className="text-xs text-slate-400">
          {status === "ready" && "Ready to record • Ensure you are centered in good lighting"}
          {status === "recording" && "Speaking now • Look directly into the camera"}
          {status === "paused" && "Paused • Click resume when you are ready to continue"}
          {status === "preview" && "Review your recording before submitting for AI analysis"}
        </div>

        <div className="flex items-center gap-2">
          {status === "ready" && permissionGranted && (
            <button
              type="button"
              onClick={startRecording}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-red-500/20 active:scale-95"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>Start Recording</span>
            </button>
          )}

          {status === "recording" && (
            <>
              <button
                type="button"
                onClick={pauseRecording}
                className="px-3.5 py-2 rounded-xl bg-surface-600 hover:bg-surface-500 text-slate-200 text-xs font-medium transition-all flex items-center gap-1.5 border border-white/10"
              >
                <Pause size={14} />
                <span>Pause</span>
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-red-500/30"
              >
                <Square size={14} />
                <span>Stop & Review</span>
              </button>
            </>
          )}

          {status === "paused" && (
            <>
              <button
                type="button"
                onClick={resumeRecording}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-lg"
              >
                <Play size={14} />
                <span>Resume</span>
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Square size={14} />
                <span>Finish</span>
              </button>
            </>
          )}

          {status === "preview" && (
            <button
              type="button"
              onClick={retakeVideo}
              className="px-4 py-2 rounded-xl bg-surface-600 hover:bg-surface-500 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 border border-white/10"
            >
              <RotateCcw size={14} />
              <span>Retake Video</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
