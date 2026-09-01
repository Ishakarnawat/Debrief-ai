const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const Analysis = require("../models/Analysis");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * POST /api/analyze
 * Receives audio/video file, forwards to ML service, stores result in MongoDB.
 */
const analyzeInterview = async (req, res) => {
  const uploadedFile = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);

  if (!uploadedFile) {
    return res.status(400).json({ error: "No audio or video file uploaded" });
  }

  const userId = req.auth.userId;
  const filePath = uploadedFile.path;
  const isVideo = uploadedFile.mimetype.startsWith("video/");
  const mediaType = req.body.mediaType || (isVideo ? "video" : "audio");
  const mediaUrl = `/uploads/${uploadedFile.filename}`;

  const candidateName = req.body.candidateName || "Candidate";
  const targetRole = req.body.targetRole || "General Role";
  const question = req.body.question || "General Interview Question";

  try {
    // ── Forward media to Python ML service ─────────────────────────────────
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), {
      filename: uploadedFile.originalname,
      contentType: uploadedFile.mimetype,
    });

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze`, form, {
      headers: form.getHeaders(),
      timeout: 90000, // 90s — video transcription can be longer
    });

    const mlData = mlResponse.data;

    // Attach media info to returned payload
    mlData.mediaType = mediaType;
    mlData.mediaUrl = mediaUrl;
    mlData.candidateName = candidateName;
    mlData.targetRole = targetRole;
    mlData.question = question;

    // ── Persist result to MongoDB ───────────────────────────────────────────
    const analysis = await Analysis.create({
      userId,
      transcript: mlData.transcript,
      scores: mlData.scores,
      weaknesses: mlData.weaknesses,
      star: mlData.star,
      improved_answer: mlData.improved_answer,
      follow_up_question: mlData.follow_up_question,
      hiring_score: mlData.hiring_score,
      filler_words: mlData.filler_words,
      wpm: mlData.wpm,
      filename: uploadedFile.originalname,
      mediaType,
      mediaUrl,
      candidateName,
      targetRole,
      question,
    });

    res.status(200).json({ success: true, analysisId: analysis._id, data: mlData });
  } catch (err) {
    // If ML service fails or error occurs, clean up if needed
    if (!isVideo) {
      fs.unlink(filePath, () => {});
    }
    throw err;
  }
};

module.exports = { analyzeInterview };
