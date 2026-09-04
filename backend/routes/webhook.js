const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getSettings,
  updateSettings,
  testWebhook,
} = require("../controllers/webhookController");

router.get("/", requireAuth, getSettings);
router.post("/", requireAuth, updateSettings);
router.post("/test", requireAuth, testWebhook);

module.exports = router;
