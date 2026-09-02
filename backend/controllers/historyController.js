const fs = require("fs");
const path = require("path");
const Analysis = require("../models/Analysis");

/**
 * GET /api/history
 * Returns all analyses for the authenticated user, newest first.
 */
const getHistory = async (req, res) => {
  const userId = req.auth.userId;
  const analyses = await Analysis.find({ userId })
    .sort({ createdAt: -1 })
    .select("-transcript") // omit heavy field in list view
    .lean();

  res.json({ success: true, data: analyses });
};

/**
 * GET /api/history/:id
 * Returns single analysis by ID (only if owned by user).
 */
const getAnalysisById = async (req, res) => {
  const userId = req.auth.userId;
  const analysis = await Analysis.findOne({ _id: req.params.id, userId }).lean();

  if (!analysis) {
    return res.status(404).json({ error: "Analysis not found" });
  }

  res.json({ success: true, data: analysis });
};

/**
 * DELETE /api/history/:id
 * Permanently deletes single analysis and its recorded video/audio file from disk.
 */
const deleteAnalysis = async (req, res) => {
  const userId = req.auth.userId;
  const { id } = req.params;

  const analysis = await Analysis.findOne({ _id: id, userId });
  if (!analysis) {
    return res.status(404).json({ error: "Analysis record not found" });
  }

  // Delete physical video/audio file from uploads folder if it exists
  if (analysis.mediaUrl) {
    const filename = path.basename(analysis.mediaUrl);
    const filePath = path.join(__dirname, "../uploads", filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete physical media file:", err);
      }
    }
  }

  await Analysis.findByIdAndDelete(id);
  res.json({ success: true, message: "Recording and evaluation data deleted permanently." });
};

module.exports = { getHistory, getAnalysisById, deleteAnalysis };
