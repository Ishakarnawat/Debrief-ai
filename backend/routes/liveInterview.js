const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getSessionContext,
  getNextQuestion,
  evaluateCode,
  completeLiveInterview,
} = require("../controllers/liveInterviewController");

router.get("/session-context", requireAuth, getSessionContext);
router.post("/next-question", requireAuth, getNextQuestion);
router.post("/evaluate-code", requireAuth, evaluateCode);
router.post("/complete", requireAuth, completeLiveInterview);

module.exports = router;
