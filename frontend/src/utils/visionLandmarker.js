import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

let landmarkerInstance = null;
let isInitializing = false;
let initError = null;

// CDN hosted assets from Google MediaPipe
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/**
 * Initializes and caches the MediaPipe FaceLandmarker
 */
export async function getFaceLandmarker() {
  if (landmarkerInstance) return landmarkerInstance;
  if (isInitializing) {
    // Wait for in-flight initialization
    while (isInitializing) {
      await new Promise((res) => setTimeout(res, 50));
    }
    return landmarkerInstance;
  }

  isInitializing = true;
  initError = null;

  try {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    landmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_ASSET_PATH,
        delegate: "GPU",
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 2, // detect up to 2 faces to identify unauthorized bystanders
    });
    return landmarkerInstance;
  } catch (err) {
    console.warn("MediaPipe GPU initialization failed, attempting CPU fallback:", err);
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      landmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_PATH,
          delegate: "CPU",
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 2,
      });
      return landmarkerInstance;
    } catch (fallbackErr) {
      console.warn("MediaPipe FaceLandmarker unavailable (network/WASM restricted):", fallbackErr);
      initError = fallbackErr;
      return null;
    }
  } finally {
    isInitializing = false;
  }
}

/**
 * Computes 3D Head Pose (Yaw, Pitch, Roll) from standard landmarks:
 * Nose tip: 1
 * Chin: 152
 * Left eye outer: 33
 * Right eye outer: 263
 * Forehead: 10
 */
export function calculateHeadPose(landmarks) {
  if (!landmarks || landmarks.length < 264) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const nose = landmarks[1];
  const chin = landmarks[152];
  const forehead = landmarks[10];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  // Yaw: horizontal rotation (nose position relative to midpoint between eyes)
  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeDistX = Math.abs(rightEye.x - leftEye.x) || 0.001;
  const yaw = Math.round(((nose.x - eyeMidX) / eyeDistX) * 90);

  // Pitch: vertical tilt (nose position between forehead and chin)
  const faceMidY = (forehead.y + chin.y) / 2;
  const faceHeightY = Math.abs(chin.y - forehead.y) || 0.001;
  const pitch = Math.round(((nose.y - faceMidY) / faceHeightY) * 90);

  // Roll: tilt angle between the two eyes
  const deltaX = rightEye.x - leftEye.x;
  const deltaY = rightEye.y - leftEye.y;
  const roll = Math.round((Math.atan2(deltaY, deltaX) * 180) / Math.PI);

  return { yaw, pitch, roll };
}

/**
 * Computes Gaze Direction from iris center relative to eye corners:
 * Left eye inner: 133, outer: 33, iris center: 468
 * Right eye inner: 362, outer: 263, iris center: 473
 */
export function calculateGaze(landmarks, headPose) {
  if (!landmarks || landmarks.length < 474) {
    // Fallback based on head pose
    if (Math.abs(headPose.yaw) > 18) {
      return {
        direction: headPose.yaw > 0 ? "LOOKING_RIGHT" : "LOOKING_LEFT",
        isCentered: false,
        score: Math.max(40, 100 - Math.abs(headPose.yaw) * 2),
      };
    }
    if (headPose.pitch > 15) {
      return { direction: "LOOKING_DOWN", isCentered: false, score: 60 };
    }
    return { direction: "CENTER", isCentered: true, score: 95 };
  }

  // Left Eye Iris ratio
  const leftOuter = landmarks[33];
  const leftInner = landmarks[133];
  const leftIris = landmarks[468];

  const leftEyeWidth = Math.abs(leftInner.x - leftOuter.x) || 0.001;
  const leftRatio = (leftIris.x - Math.min(leftOuter.x, leftInner.x)) / leftEyeWidth;

  // Right Eye Iris ratio
  const rightInner = landmarks[362];
  const rightOuter = landmarks[263];
  const rightIris = landmarks[473];

  const rightEyeWidth = Math.abs(rightOuter.x - rightInner.x) || 0.001;
  const rightRatio = (rightIris.x - Math.min(rightInner.x, rightOuter.x)) / rightEyeWidth;

  const avgRatio = (leftRatio + rightRatio) / 2;

  let direction = "CENTER";
  let isCentered = true;
  let score = 95;

  // Iris threshold: 0.35 - 0.65 is centered eye contact
  if (avgRatio < 0.38 || headPose.yaw < -16) {
    direction = "LOOKING_LEFT";
    isCentered = false;
    score = Math.max(30, Math.round(100 - (0.38 - avgRatio) * 160));
  } else if (avgRatio > 0.62 || headPose.yaw > 16) {
    direction = "LOOKING_RIGHT";
    isCentered = false;
    score = Math.max(30, Math.round(100 - (avgRatio - 0.62) * 160));
  } else if (headPose.pitch > 18) {
    direction = "LOOKING_DOWN";
    isCentered = false;
    score = 65;
  } else if (headPose.pitch < -20) {
    direction = "LOOKING_UP";
    isCentered = false;
    score = 70;
  } else {
    direction = "CENTER";
    isCentered = true;
    score = Math.min(99, Math.max(85, Math.round(100 - Math.abs(headPose.yaw) * 1.5 - Math.abs(headPose.pitch))));
  }

  return { direction, isCentered, score, irisRatio: avgRatio };
}

/**
 * Detects Script Reading Patterns based on rolling gaze history
 */
export function analyzeReadingPattern(gazeHistory = []) {
  if (gazeHistory.length < 8) return false;

  const recent = gazeHistory.slice(-15);
  const leftLookCount = recent.filter((g) => g.direction === "LOOKING_LEFT").length;
  const rightLookCount = recent.filter((g) => g.direction === "LOOKING_RIGHT").length;
  const downLookCount = recent.filter((g) => g.direction === "LOOKING_DOWN").length;

  // Frequent alternating between left and right (horizontal reading saccades)
  const isReadingHorizontal = leftLookCount >= 3 && rightLookCount >= 3;
  // Sustained gaze looking down at notes or second phone
  const isLookingDown = downLookCount >= 6;

  return isReadingHorizontal || isLookingDown;
}
