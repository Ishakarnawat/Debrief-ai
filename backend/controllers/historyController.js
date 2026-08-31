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

module.exports = { getHistory, getAnalysisById };
