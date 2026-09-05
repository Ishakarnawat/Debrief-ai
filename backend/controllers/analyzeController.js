const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const Analysis = require("../models/Analysis");
const { dispatchCandidateWebhook } = require("./webhookController");

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

  const candidateName = req.body.candidateName || "Candidate";
  const candidateEmail = req.body.candidateEmail || "candidate@example.com";
  const targetRole = req.body.targetRole || "General Role";
  const question = req.body.question || "General Interview Question";
  const invitationToken = req.body.invitationToken || null;

  // Privacy & Storage Controls
  // If not from an invitation token, default to private practice mode unless requested otherwise
  const isPrivate =
    req.body.isPrivate === "true" ||
    req.body.isPrivate === true ||
    (!invitationToken && req.body.isPrivate !== "false");

  const saveVideoFile = req.body.saveVideoFile !== "false" && req.body.saveVideoFile !== false;
  let mediaUrl = saveVideoFile ? `/api/media/${uploadedFile.filename}` : "";

  // Parse proctoring data from frontend telemetry if provided
  let proctoring = {
    integrityScore: 100,
    riskLevel: "low",
    tabSwitches: 0,
    multipleFacesDetected: false,
    eyeContactPercent: 92,
    violations: [],
    gazeMetrics: {
      gazeStability: 94,
      lookingAwayCount: 0,
      scriptReadingSuspected: false,
      headPoseStability: 92,
    },
  };

  if (req.body.proctoringData) {
    try {
      const parsed = typeof req.body.proctoringData === "string"
        ? JSON.parse(req.body.proctoringData)
        : req.body.proctoringData;
      proctoring = { ...proctoring, ...parsed };
    } catch (e) {
      console.error("Failed to parse proctoringData:", e);
    }
  }

  // Calculate or adjust integrity score if not already computed
  const tabPenalty = (proctoring.tabSwitches || 0) * 15;
  const multiFacePenalty = proctoring.multipleFacesDetected ? 30 : 0;
  const eyePenalty = proctoring.eyeContactPercent < 70 ? (70 - proctoring.eyeContactPercent) * 0.5 : 0;
  const computedIntegrity = Math.max(10, Math.round(100 - tabPenalty - multiFacePenalty - eyePenalty));
  proctoring.integrityScore = proctoring.integrityScore ?? computedIntegrity;

  if (proctoring.integrityScore < 60 || proctoring.multipleFacesDetected || (proctoring.tabSwitches || 0) >= 3) {
    proctoring.riskLevel = "high";
  } else if (proctoring.integrityScore < 80 || (proctoring.tabSwitches || 0) >= 1) {
    proctoring.riskLevel = "medium";
  } else {
    proctoring.riskLevel = "low";
  }

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

    // Derived Rubric Scores (from ML scores or realistic grading)
    const clarity = mlData.scores?.clarity ?? 7;
    const depth = mlData.scores?.depth ?? 7;
    const relevance = mlData.scores?.relevance ?? 7;
    const starCount = mlData.star ? Object.values(mlData.star).filter(Boolean).length : 2;

    const rubric = {
      technicalAccuracy: depth,
      starCompliance: Number(Math.min(10, starCount * 2.5).toFixed(1)),
      communicationClarity: clarity,
      problemSolving: relevance,
      confidenceBodyLanguage: Number(
        Math.min(10, (mlData.confidence_score ? mlData.confidence_score / 10 : 8) * (proctoring.eyeContactPercent / 100)).toFixed(1)
      ),
    };

    // Calculate overall hiring recommendation
    let hiringScore = mlData.hiring_score;
    if (proctoring.riskLevel === "high") {
      hiringScore = Math.max(25, hiringScore - 20);
    } else if (proctoring.riskLevel === "medium") {
      hiringScore = Math.max(35, hiringScore - 8);
    }

    let recommendation = "Hire";
    if (hiringScore >= 85 && proctoring.riskLevel === "low") {
      recommendation = "Strong Hire";
    } else if (hiringScore >= 70 && proctoring.riskLevel !== "high") {
      recommendation = "Hire";
    } else if (hiringScore >= 50 && proctoring.riskLevel !== "high") {
      recommendation = "Borderline";
    } else {
      recommendation = "Do Not Hire";
    }

    const recruiterSummary =
      `${candidateName} demonstrated ${clarity >= 7 ? "strong" : "moderate"} verbal articulation ` +
      `with a ${rubric.starCompliance >= 7 ? "well-structured STAR answer" : "partially structured response"}. ` +
      `Proctoring integrity remained at ${proctoring.integrityScore}% (${proctoring.riskLevel.toUpperCase()} risk) ` +
      `with ${proctoring.tabSwitches} tab switch(es) detected. Recommended as ${recommendation}.`;

    // Attach media and screening info to returned payload
    mlData.mediaType = mediaType;
    mlData.mediaUrl = mediaUrl;
    mlData.candidateName = candidateName;
    mlData.candidateEmail = candidateEmail;
    mlData.targetRole = targetRole;
    mlData.question = question;
    mlData.proctoring = proctoring;
    mlData.rubric = rubric;
    mlData.recommendation = recommendation;
    mlData.recruiterSummary = recruiterSummary;
    mlData.status = "Screening";
    mlData.isPrivate = isPrivate;
    mlData.saveVideoFile = saveVideoFile;

    // If ephemeral mode (do not store video on server), remove file now
    if (!saveVideoFile && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Failed to delete ephemeral file:", e);
      }
    }

    // ── Persist result to MongoDB / LocalStore ──────────────────────────────
    const analysis = await Analysis.create({
      userId,
      transcript: mlData.transcript,
      scores: mlData.scores,
      weaknesses: mlData.weaknesses,
      star: mlData.star,
      improved_answer: mlData.improved_answer,
      follow_up_question: mlData.follow_up_question,
      hiring_score: hiringScore,
      filler_words: mlData.filler_words,
      wpm: mlData.wpm,
      filename: uploadedFile.originalname,
      mediaType,
      mediaUrl,
      candidateName,
      candidateEmail,
      targetRole,
      question,
      status: "Screening",
      recruiterNotes: "",
      proctoring,
      rubric,
      recommendation,
      recruiterSummary,
      invitationToken,
      isPrivate,
      saveVideoFile,
    });

    // Trigger automated recruiter webhook if configured and not private
    if (!isPrivate) {
      dispatchCandidateWebhook(analysis, proctoring.riskLevel === "high" ? "flagged" : "completion").catch((e) => {
        console.error("Async webhook dispatch error:", e);
      });
    }

    res.status(200).json({ success: true, analysisId: analysis._id, data: mlData });
  } catch (err) {
    // If ML service fails or error occurs, clean up if needed
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
    throw err;
  }
};

module.exports = { analyzeInterview };
