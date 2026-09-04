const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getNextQuestion,
  evaluateCode,
  completeLiveInterview,
} = require("../controllers/liveInterviewController");

router.post("/next-question", requireAuth, getNextQuestion);
router.post("/evaluate-code", requireAuth, evaluateCode);
router.post("/complete", requireAuth, completeLiveInterview);

module.exports = router;
