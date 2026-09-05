import { useEffect, useRef, useState, useCallback } from "react";
import {
  getFaceLandmarker,
  calculateHeadPose,
  calculateGaze,
  analyzeReadingPattern,
} from "../utils/visionLandmarker";
import { Eye, EyeOff, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

// Key facial contour indices for drawing lightweight HUD wireframe
const JAW_INDICES = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362];

export default function VisionMeshOverlay({
  videoRef,
  isActive = true,
  onMetricsUpdate,
  showWireframeToggle = true,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const gazeHistoryRef = useRef([]);

  const [showWireframe, setShowWireframe] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [hudData, setHudData] = useState({
    faceCount: 1,
    gaze: { direction: "CENTER", score: 96 },
    headPose: { yaw: 0, pitch: 0, roll: 0 },
    scriptReading: false,
  });

  // Load MediaPipe FaceLandmarker model
  useEffect(() => {
    let mounted = true;
    getFaceLandmarker().then((landmarker) => {
      if (mounted && landmarker) {
        setModelReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Main real-time visual detection loop
  const processFrame = useCallback(() => {
    if (!isActive || !videoRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Run MediaPipe inference if available
    getFaceLandmarker().then((landmarker) => {
      if (!landmarker || !video || video.paused || video.ended) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      try {
        const timestamp = performance.now();
        const results = landmarker.detectForVideo(video, timestamp);

        const faceCount = results.faceLandmarks ? results.faceLandmarks.length : 0;

        if (faceCount > 0) {
          const landmarks = results.faceLandmarks[0];
          const headPose = calculateHeadPose(landmarks);
          const gaze = calculateGaze(landmarks, headPose);

          // Update rolling history for script reading detection
          gazeHistoryRef.current.push({
            direction: gaze.direction,
            timestamp,
          });
          if (gazeHistoryRef.current.length > 30) gazeHistoryRef.current.shift();

          const scriptReading = analyzeReadingPattern(gazeHistoryRef.current);

          const metrics = {
            faceCount,
            gaze,
            headPose,
            scriptReading,
            hasMultipleFaces: faceCount > 1,
          };

          setHudData(metrics);
          if (onMetricsUpdate) {
            onMetricsUpdate(metrics);
          }

          // Draw Cyberpunk Vision HUD on Canvas if toggled on
          if (showWireframe && ctx && canvas) {
            drawVisionHUD(ctx, canvas, landmarks, gaze, headPose, faceCount > 1);
          }
        } else {
          // 0 faces detected
          const emptyMetrics = {
            faceCount: 0,
            gaze: { direction: "ABSENT", score: 0 },
            headPose: { yaw: 0, pitch: 0, roll: 0 },
            scriptReading: false,
            hasMultipleFaces: false,
          };
          setHudData(emptyMetrics);
          if (onMetricsUpdate) {
            onMetricsUpdate(emptyMetrics);
          }
        }
      } catch (err) {
        // Ignored frame glitch
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    });
  }, [isActive, videoRef, showWireframe, onMetricsUpdate]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [processFrame]);

  // Drawing helper
  const drawVisionHUD = (ctx, canvas, landmarks, gaze, headPose, isMultiFace) => {
    const w = canvas.width;
    const h = canvas.height;

    const strokeColor = isMultiFace ? "rgba(239, 68, 68, 0.7)" : "rgba(99, 102, 241, 0.6)";

    // 1. Draw Eye Contours
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = strokeColor;
    drawPath(ctx, landmarks, LEFT_EYE_INDICES, w, h);
    drawPath(ctx, landmarks, RIGHT_EYE_INDICES, w, h);

    // 2. Draw Jaw / Face Oval
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    drawPath(ctx, landmarks, JAW_INDICES, w, h);

    // 3. Draw Iris Focus Reticle
    if (landmarks[468] && landmarks[473]) {
      const leftIris = landmarks[468];
      const rightIris = landmarks[473];

      ctx.fillStyle = gaze.isCentered ? "rgba(52, 211, 153, 0.9)" : "rgba(251, 191, 36, 0.9)";
      ctx.beginPath();
      ctx.arc(leftIris.x * w, leftIris.y * h, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(rightIris.x * w, rightIris.y * h, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw Center Gaze Crosshair on Nose Tip
    if (landmarks[1]) {
      const nose = landmarks[1];
      const cx = nose.x * w;
      const cy = nose.y * h;

      ctx.strokeStyle = gaze.isCentered ? "rgba(99, 102, 241, 0.5)" : "rgba(239, 68, 68, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.moveTo(cx - 16, cy);
      ctx.lineTo(cx + 16, cy);
      ctx.moveTo(cx, cy - 16);
      ctx.lineTo(cx, cy + 16);
      ctx.stroke();
    }
  };

  const drawPath = (ctx, landmarks, indices, w, h) => {
    ctx.beginPath();
    indices.forEach((idx, i) => {
      const p = landmarks[idx];
      if (p) {
        if (i === 0) ctx.moveTo(p.x * w, p.y * h);
        else ctx.lineTo(p.x * w, p.y * h);
      }
    });
    ctx.stroke();
  };

  const isWarning =
    hudData.faceCount > 1 ||
    hudData.faceCount === 0 ||
    hudData.scriptReading ||
    !hudData.gaze.isCentered;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {/* Canvas for landmark lines */}
      <canvas ref={canvasRef} className="w-full h-full object-cover -scale-x-100" />

      {/* Floating Top HUD Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Eye Contact Pill */}
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold backdrop-blur-md border flex items-center gap-1 ${
              hudData.gaze.isCentered
                ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300"
                : "bg-amber-950/70 border-amber-500/40 text-amber-300"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hudData.gaze.isCentered ? "bg-emerald-400" : "bg-amber-400 animate-ping"
              }`}
            />
            <span>
              Gaze: {hudData.gaze.score}% (
              {hudData.gaze.direction === "CENTER"
                ? "Eye Contact"
                : hudData.gaze.direction.replace("_", " ")}
              )
            </span>
          </span>

          {/* Head Pose Yaw Pill */}
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono backdrop-blur-md bg-black/60 border border-white/10 text-slate-300">
            Yaw: {hudData.headPose.yaw > 0 ? `+${hudData.headPose.yaw}°` : `${hudData.headPose.yaw}°`}
          </span>

          {/* Face Count Pill */}
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold backdrop-blur-md border flex items-center gap-1 ${
              hudData.faceCount === 1
                ? "bg-slate-900/80 border-white/10 text-slate-300"
                : "bg-red-950/80 border-red-500/50 text-red-300 animate-pulse"
            }`}
          >
            {hudData.faceCount === 1 ? (
              <ShieldCheck size={11} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={11} className="text-red-400" />
            )}
            <span>
              {hudData.faceCount === 1
                ? "1 Face Verified"
                : hudData.faceCount === 0
                ? "No Face Detected"
                : `${hudData.faceCount} Faces Detected`}
            </span>
          </span>
        </div>

        {/* Wireframe Toggle Button */}
        {showWireframeToggle && (
          <button
            type="button"
            onClick={() => setShowWireframe(!showWireframe)}
            title={showWireframe ? "Hide vision wireframe" : "Show vision wireframe"}
            className="p-1 rounded-md bg-black/60 hover:bg-black/80 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {showWireframe ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        )}
      </div>

      {/* Script Reading or Multi-Face Banner Alert */}
      {hudData.scriptReading && (
        <div className="absolute bottom-12 left-3 right-3 p-2 rounded-lg bg-amber-500/90 text-slate-950 text-xs font-semibold text-center backdrop-blur-md flex items-center justify-center gap-1.5 shadow-lg animate-bounce">
          <AlertTriangle size={14} />
          <span>Notice: High gaze variance detected. Please maintain eye contact with the camera.</span>
        </div>
      )}

      {hudData.faceCount > 1 && (
        <div className="absolute bottom-12 left-3 right-3 p-2 rounded-lg bg-red-600/90 text-white text-xs font-bold text-center backdrop-blur-md flex items-center justify-center gap-1.5 shadow-lg animate-pulse">
          <ShieldAlert size={14} />
          <span>Security Alert: Secondary face detected in camera frame!</span>
        </div>
      )}
    </div>
  );
}
