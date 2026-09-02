const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getHistory, getAnalysisById, deleteAnalysis } = require("../controllers/historyController");

const router = express.Router();

// GET /api/history        — list all analyses for user
router.get("/", requireAuth, getHistory);

// GET /api/history/:id    — single analysis detail
router.get("/:id", requireAuth, getAnalysisById);

// DELETE /api/history/:id — permanently delete analysis & video file
router.delete("/:id", requireAuth, deleteAnalysis);

module.exports = router;
