require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const analyzeRoutes = require("./routes/analyze");
const historyRoutes = require("./routes/history");
const mediaRoutes = require("./routes/media");
const { recruiterRouter, publicInvitationHandler } = require("./routes/recruiter");
const webhookRoutes = require("./routes/webhook");
const liveInterviewRoutes = require("./routes/liveInterview");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/analyze", analyzeRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/recruiter", recruiterRouter);
app.use("/api/recruiter/webhooks", webhookRoutes);
app.use("/api/live-interview", liveInterviewRoutes);
app.get("/api/invitations/:token", publicInvitationHandler);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "mongodb" : "local_storage",
  });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// ─── Connect DB & Start ───────────────────────────────────────────────────────
const start = async () => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/debrief_ai";
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.log("ℹ️  MongoDB not connected. Running in local session storage mode.");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
  });
};

start();
