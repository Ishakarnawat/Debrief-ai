const express = require("express");
const fs = require("fs");
const path = require("path");
const { requireAuth } = require("../middleware/auth");
const {
  getStorageConfig,
  generatePresignedUpload,
  directUploadTokens,
} = require("../services/cloudStorage");

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, "../uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * GET /api/media/storage-config
 * Returns active storage provider capabilities (AWS S3, Cloudinary, Local Direct).
 */
router.get("/storage-config", requireAuth, (req, res) => {
  res.json({
    success: true,
    config: getStorageConfig(),
  });
});

/**
 * POST /api/media/presigned-url
 * Generates direct-to-cloud presigned upload URL or direct stream token.
 */
router.post("/presigned-url", requireAuth, (req, res) => {
  const { filename = "interview.mp4", contentType = "video/mp4" } = req.body;
  const presigned = generatePresignedUpload({ filename, contentType });
  res.json({
    success: true,
    ...presigned,
  });
});

/**
 * PUT /api/media/direct-upload/:token
 * High-performance direct streaming endpoint for local binary uploads (bypasses Multer multipart overhead).
 */
router.put("/direct-upload/:token", (req, res) => {
  const token = req.params.token;
  const tokenData = directUploadTokens.get(token);

  if (!tokenData) {
    return res.status(403).json({ error: "Invalid or expired direct upload token." });
  }

  const targetPath = path.join(UPLOAD_DIR, tokenData.filename);
  const writeStream = fs.createWriteStream(targetPath);

  req.pipe(writeStream);

  writeStream.on("finish", () => {
    directUploadTokens.delete(token);
    res.json({
      success: true,
      filename: tokenData.filename,
      mediaUrl: `/api/media/${tokenData.filename}`,
      bytesWritten: writeStream.bytesWritten,
    });
  });

  writeStream.on("error", (err) => {
    console.error("Direct upload stream error:", err);
    res.status(500).json({ error: "Failed to stream direct media payload." });
  });
});

/**
 * GET /api/media/:filename
 * Secure streaming of uploaded audio/video files with HTTP Range support.
 * Prevents directory traversal attacks and requires user session.
 */
router.get("/:filename", requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Media file not found or has been deleted." });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(filename).toLowerCase();
  const mimeMap = {
    ".webm": "video/webm",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
  };
  const contentType = mimeMap[ext] || "video/webm";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

module.exports = router;
