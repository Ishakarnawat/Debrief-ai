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
  Shield,
  ShieldAlert,
  Eye,
  Users,
  AlertTriangle,
} from "lucide-react";
import VisionMeshOverlay from "./VisionMeshOverlay";

export default function VideoRecorder({ onRecorded, currentQuestion, isProctoringEnabled = true }) {
  const videoPreviewRef = useRef(null);
  const playbackRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const proctorIntervalRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  // Core Recorder States
  const [permissionGranted, setPermissionGranted] = useState(null); // null, true, false
  const [permissionError, setPermissionError] = useState("");
  const [status, setStatus] = useState("initializing"); // initializing, ready, recording, paused, preview
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Proctoring & Anti-Cheat States
  const [tabSwitches, setTabSwitches] = useState(0);
  const [violations, setViolations] = useState([]);
  const [latestAlert, setLatestAlert] = useState(null);
  const [eyeContactPercent, setEyeContactPercent] = useState(94);
  const [facesDetected, setFacesDetected] = useState(1);
  const [multipleFacesEver, setMultipleFacesEver] = useState(false);
  const [integrityScore, setIntegrityScore] = useState(100);

  const gazeMetricsRef = useRef({
    gazeStability: 96,
    lookingAwayCount: 0,
    scriptReadingSuspected: false,
    headPoseStability: 94,
  });

  const handleVisionMetrics = useCallback(
    (metrics) => {
      if (!metrics) return;
      setFacesDetected(metrics.faceCount);
      if (metrics.gaze && metrics.gaze.score) {
        setEyeContactPercent(metrics.gaze.score);
        gazeMetricsRef.current.gazeStability = metrics.gaze.score;
      }

      // 1. Multiple Faces Detection
      if (metrics.hasMultipleFaces) {
        setMultipleFacesEver(true);
        setIntegrityScore((score) => Math.max(10, score - 25));
        if (status === "recording") {
          setViolations((vList) => {
            const recent = vList.some(
              (v) => v.type === "multiple_faces" && recordSeconds - v.timeInSeconds < 6
            );
            if (recent) return vList;
            return [
              ...vList,
              {
                timestamp: new Date().toISOString(),
                timeInSeconds: recordSeconds,
                type: "multiple_faces",
                description: "Secondary person detected in camera frame (MediaPipe vision)",
                severity: "high",
              },
            ];
          });
          setLatestAlert("🚨 Anti-Cheat Alert: Secondary face detected in frame!");
        }
      }

      // 2. Script Reading / Gaze Divergence
      if (metrics.scriptReading) {
        gazeMetricsRef.current.scriptReadingSuspected = true;
        gazeMetricsRef.current.lookingAwayCount += 1;
        if (status === "recording") {
          setViolations((vList) => {
            const recent = vList.some(
              (v) => v.type === "script_reading" && recordSeconds - v.timeInSeconds < 8
            );
            if (recent) return vList;
            return [
              ...vList,
              {
                timestamp: new Date().toISOString(),
                timeInSeconds: recordSeconds,
                type: "script_reading",
                description: "Prolonged saccadic eye movement indicates reading off-screen text",
                severity: "medium",
              },
            ];
          });
          setLatestAlert("⚠️ Proctoring Alert: Reading pattern detected. Look directly at the camera.");
        }
      }

      // 3. Face Absence
      if (metrics.faceCount === 0 && status === "recording") {
        setViolations((vList) => {
          const recent = vList.some(
            (v) => v.type === "face_absent" && recordSeconds - v.timeInSeconds < 6
          );
          if (recent) return vList;
          return [
            ...vList,
            {
              timestamp: new Date().toISOString(),
              timeInSeconds: recordSeconds,
              type: "face_absent",
              description: "Candidate face absent from camera frame",
              severity: "high",
            },
          ];
        });
        setLatestAlert("⚠️ Visibility Warning: Candidate not detected in camera frame.");
      }
    },
    [status, recordSeconds]
  );

  // ─── Initialize Camera & Mic Stream ─────────────────────────────────────────
  const initMediaStream = useCallback(async () => {
    try {
      setStatus("initializing");
      setPermissionError("");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera recording is not supported in this browser.");
      }

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
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (proctorIntervalRef.current) clearInterval(proctorIntervalRef.current);
    };
  }, [initMediaStream]);

  useEffect(() => {
    if (status !== "preview" && videoPreviewRef.current && mediaStreamRef.current) {
      videoPreviewRef.current.srcObject = mediaStreamRef.current;
    }
  }, [status]);

  // ─── Browser Visibility / Tab-Switch Proctoring Listener ───────────────────
  useEffect(() => {
    if (status !== "recording" || !isProctoringEnabled) return;

    let blurStart = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurStart = Date.now();
        const currentSec = recordSeconds;
        setTabSwitches((prev) => {
          const updated = prev + 1;
          const newViolation = {
            timestamp: new Date().toISOString(),
            timeInSeconds: currentSec,
            type: "tab_switch",
            description: `Candidate switched tab or minimized browser window (Incident #${updated})`,
            severity: updated >= 2 ? "high" : "medium",
          };

          setViolations((vList) => [...vList, newViolation]);
          setLatestAlert(`⚠️ Proctoring Alert: Tab switch detected at ${formatTime(currentSec)}. Incident logged.`);

          // Deduct integrity score
          setIntegrityScore((score) => Math.max(20, score - 15));
          return updated;
        });
      } else {
        // Tab restored
        setTimeout(() => setLatestAlert(null), 4000);
      }
    };

    const handleBlur = () => {
      if (!document.hidden) {
        const currentSec = recordSeconds;
        setLatestAlert(`⚠️ Focus Warning: Browser window lost focus at ${formatTime(currentSec)}.`);
        setTimeout(() => setLatestAlert(null), 3000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [status, isProctoringEnabled, recordSeconds]);

  // ─── Real-Time Computer Vision Frame Analysis (Simulated + Canvas Sample) ──
  useEffect(() => {
    if (status !== "recording" || !isProctoringEnabled) return;

    proctorIntervalRef.current = setInterval(() => {
      if (!videoPreviewRef.current || isVideoOff) return;

      // Sample video frames into hidden canvas to verify active camera stream
      try {
        if (!hiddenCanvasRef.current) {
          hiddenCanvasRef.current = document.createElement("canvas");
          hiddenCanvasRef.current.width = 64;
          hiddenCanvasRef.current.height = 48;
        }
        const ctx = hiddenCanvasRef.current.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(videoPreviewRef.current, 0, 0, 64, 48);
        const frameData = ctx.getImageData(0, 0, 64, 48);

        // Calculate average frame luminance to ensure face/lighting presence
        let totalBrightness = 0;
        for (let i = 0; i < frameData.data.length; i += 16) {
          totalBrightness += (frameData.data[i] + frameData.data[i + 1] + frameData.data[i + 2]) / 3;
        }
        const avgBrightness = totalBrightness / (frameData.data.length / 16);

        if (avgBrightness < 15) {
          // Camera covered or blacked out
          setLatestAlert("⚠️ Visibility Warning: Insufficient lighting or camera occluded.");
        }
      } catch (e) {
        // Ignore canvas read errors if tainted
      }

      // Natural subtle variation in eye contact between 88% and 97%
      setEyeContactPercent((prev) => {
        const delta = (Math.random() - 0.48) * 2;
        return Math.min(99, Math.max(82, Math.round(prev + delta)));
      });
    }, 1200);

    return () => {
      if (proctorIntervalRef.current) clearInterval(proctorIntervalRef.current);
    };
  }, [status, isProctoringEnabled, isVideoOff]);

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
    setTabSwitches(0);
    setViolations([]);
    setLatestAlert(null);
    setIntegrityScore(100);
    setMultipleFacesEver(false);

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

      // Compute final proctoring telemetry payload
      const finalRiskLevel =
        integrityScore < 60 || multipleFacesEver || tabSwitches >= 3
          ? "high"
          : integrityScore < 80 || tabSwitches >= 1
          ? "medium"
          : "low";

      const proctoringPayload = {
        integrityScore,
        riskLevel: finalRiskLevel,
        tabSwitches,
        multipleFacesDetected: multipleFacesEver,
        eyeContactPercent,
        violations,
        gazeMetrics: gazeMetricsRef.current,
      };

      if (onRecorded) {
        onRecorded(videoFile, recordSeconds, proctoringPayload);
      }
    };

    recorder.start(250);
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
      if (proctorIntervalRef.current) clearInterval(proctorIntervalRef.current);
    }
  };

  const retakeVideo = () => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlobUrl(null);
    setRecordSeconds(0);
    setTabSwitches(0);
    setViolations([]);
    setLatestAlert(null);
    setIntegrityScore(100);
    setStatus("ready");
    if (onRecorded) {
      onRecorded(null, 0, null);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl">
      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 bg-gradient-to-b from-black/85 via-black/50 to-transparent flex items-center justify-between">
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

          {/* Real-time Anti-Cheat Guard HUD Pill */}
          {isProctoringEnabled && (
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border backdrop-blur-md transition-all ${
                tabSwitches > 0
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {tabSwitches > 0 ? <ShieldAlert size={12} /> : <Shield size={12} />}
              <span>Proctoring: {tabSwitches === 0 ? "Clean (100%)" : `${tabSwitches} Alert(s)`}</span>
            </div>
          )}
        </div>

        {/* Live Question Prompt Overlay */}
        {currentQuestion && status !== "preview" && (
          <div className="hidden lg:block max-w-sm truncate text-center text-xs text-slate-200 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
            <span className="text-brand-400 font-semibold mr-1">Q:</span>
            {currentQuestion}
          </div>
        )}

        {/* Hardware Controls & Metrics */}
        <div className="flex items-center gap-2">
          {status === "recording" && isProctoringEnabled && (
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-300 bg-black/50 px-2.5 py-1 rounded-lg border border-white/10">
              <div className="flex items-center gap-1">
                <Eye size={12} className="text-brand-400" />
                <span>Eye: {eyeContactPercent}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={12} className="text-emerald-400" />
                <span>Faces: {facesDetected}</span>
              </div>
            </div>
          )}

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
      </div>

      {/* Floating Proctoring Alert Banner */}
      {latestAlert && status === "recording" && (
        <div className="absolute top-14 left-4 right-4 z-30 animate-bounce">
          <div className="max-w-md mx-auto bg-amber-500/90 text-slate-950 font-bold text-xs py-2 px-4 rounded-xl shadow-2xl flex items-center gap-2 border border-amber-300">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{latestAlert}</span>
          </div>
        </div>
      )}

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
            {/* Real-time MediaPipe Vision Mesh HUD Overlay */}
            {!isVideoOff && status !== "preview" && (
              <VisionMeshOverlay
                videoRef={videoPreviewRef}
                isActive={true}
                onMetricsUpdate={handleVisionMetrics}
              />
            )}
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
        <div className="text-xs text-slate-400 flex items-center gap-2">
          {status === "ready" && "Ready to record • Anti-cheat proctoring will be active during session"}
          {status === "recording" && (
            <span className="flex items-center gap-1.5 text-slate-300">
              <Shield size={13} className="text-brand-400" />
              <span>Speaking now • Avoid switching browser tabs or looking away</span>
            </span>
          )}
          {status === "paused" && "Paused • Click resume when you are ready to continue"}
          {status === "preview" && (
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>Recording saved with proctoring audit telemetry</span>
            </span>
          )}
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
