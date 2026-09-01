const express = require("express");
const multer = require("multer");
const path = require("path");
const { requireAuth } = require("../middleware/auth");
const { analyzeInterview } = require("../controllers/analyzeController");

const router = express.Router();

// ── Multer config: store uploads in /tmp/debrief-uploads ──────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    require("fs").mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max for video
  fileFilter: (req, file, cb) => {
    const isAudioOrVideo =
      file.mimetype.startsWith("audio/") ||
      file.mimetype.startsWith("video/") ||
      ["audio/mpeg", "audio/wav", "audio/mp4", "audio/webm", "audio/ogg", "video/mp4", "video/webm", "video/quicktime", "video/ogg"].includes(file.mimetype);
    if (isAudioOrVideo) cb(null, true);
    else cb(new Error("Only audio or video files are allowed"));
  },
});

// POST /api/analyze — accepts audio, video or media field
router.post("/", requireAuth, upload.any(), analyzeInterview);

module.exports = router;
