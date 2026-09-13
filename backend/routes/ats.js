/**
 * Debrief.ai — ATS Screener Recruiter Routes
 * Phase 4: Node.js Express Gateway endpoints for job posting
 * and resume batch screening via the FastAPI microservice.
 */

const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");
const resumeClient = require("../services/resumeServiceClient");

const router = express.Router();

// In-memory multer storage (buffers passed to FastAPI via form-data)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 20 }, // max 10 MB, 20 files
});

// ── Microservice Health ───────────────────────────────────────────────────────

/**
 * GET /api/recruiter/ats/health
 * Proxy health check to the FastAPI microservice.
 */
router.get("/health", async (req, res) => {
  try {
    const data = await resumeClient.healthCheck();
    res.json(data);
  } catch (err) {
    res
      .status(503)
      .json({ status: "unreachable", error: err.message });
  }
});

// ── Job Descriptions ──────────────────────────────────────────────────────────

/**
 * POST /api/recruiter/ats/jobs
 * Create/register a new Job Description in the ATS DB.
 */
router.post("/jobs", requireAuth, async (req, res) => {
  const job = await resumeClient.createJob(req.body);
  res.status(201).json(job);
});

/**
 * GET /api/recruiter/ats/jobs
 * List all stored Job Descriptions with candidate counts.
 */
router.get("/jobs", requireAuth, async (req, res) => {
  const jobs = await resumeClient.listJobs();
  res.json(jobs);
});

/**
 * GET /api/recruiter/ats/jobs/:jobId
 * Get a single Job Description.
 */
router.get("/jobs/:jobId", requireAuth, async (req, res) => {
  const job = await resumeClient.getJob(Number(req.params.jobId));
  res.json(job);
});

// ── ATS Screening ─────────────────────────────────────────────────────────────

/**
 * POST /api/recruiter/ats/jobs/:jobId/screen-resumes
 * Batch upload up to 20 resumes and run ATS screening against a Job.
 * The microservice auto-provisions interview tokens for candidates >= 75%.
 */
router.post(
  "/jobs/:jobId/screen-resumes",
  requireAuth,
  upload.array("resumes", 20),
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No resume files provided." });
    }

    const { job_title, job_description, experience_level_required } = req.body;
    if (!job_title || !job_description) {
      return res
        .status(400)
        .json({ error: "job_title and job_description are required." });
    }

    const result = await resumeClient.batchScreenResumes(req.files, {
      job_title,
      job_description,
      experience_level_required,
    });
    res.json(result);
  }
);

/**
 * POST /api/recruiter/ats/screen
 * Real-time single resume screening (no job ID needed).
 */
router.post(
  "/screen",
  requireAuth,
  upload.single("resume_file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No resume file provided." });
    }
    const result = await resumeClient.screenResume(req.file, req.body);
    res.json(result);
  }
);

/**
 * GET /api/recruiter/ats/jobs/:jobId/rankings
 * Retrieve ATS-ranked candidate leaderboard for a job.
 */
router.get("/jobs/:jobId/rankings", requireAuth, async (req, res) => {
  const rankings = await resumeClient.getJobRankings(
    Number(req.params.jobId)
  );
  res.json(rankings);
});

/**
 * POST /api/recruiter/ats/jobs/:jobId/candidates/:candidateId/screen
 * Re-screen an existing candidate against a job (persists result to DB).
 */
router.post(
  "/jobs/:jobId/candidates/:candidateId/screen",
  requireAuth,
  async (req, res) => {
    const result = await resumeClient.screenJobCandidate(
      Number(req.params.jobId),
      Number(req.params.candidateId)
    );
    res.json(result);
  }
);

module.exports = router;
