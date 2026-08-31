const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const Analysis = require("../models/Analysis");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * POST /api/analyze
 * Receives audio file, forwards to ML service, stores result in MongoDB.
 */
const analyzeInterview = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }

  const userId = req.auth.userId;
  const filePath = req.file.path;

  try {
    // ── Forward audio to Python ML service ─────────────────────────────────
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze`, form, {
      headers: form.getHeaders(),
      timeout: 60000, // 60s — transcription can be slow
    });

    const mlData = mlResponse.data;

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
      filename: req.file.originalname,
    });

    res.status(200).json({ success: true, analysisId: analysis._id, data: mlData });
  } finally {
    // Always clean up temp file
    fs.unlink(filePath, () => {});
  }
};

module.exports = { analyzeInterview };
