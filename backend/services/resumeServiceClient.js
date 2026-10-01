/**
 * Debrief.ai — Resume Screener Microservice Client
 * Phase 4: Node.js API Gateway Integration
 *
 * Proxies requests from the Express Gateway to the FastAPI
 * Resume Screening Microservice running on port 8001.
 */

const axios = require("axios");
const FormData = require("form-data");

const RESUME_SERVICE_URL =
  process.env.RESUME_SERVICE_URL || "http://localhost:8001";

const resumeServiceAxios = axios.create({
  baseURL: `${RESUME_SERVICE_URL}/api/v1`,
  timeout: 60000, // 60s for Gemini AI calls
});

// ── Job Description CRUD ─────────────────────────────────────────────────────

/**
 * Create a new Job Description in the ATS database.
 * @param {{ title, department, experience_level, raw_content, required_skills }} jobData
 */
async function createJob(jobData) {
  const response = await resumeServiceAxios.post("/jobs", jobData);
  return response.data;
}

/**
 * List all stored Job Descriptions with their candidate counts.
 */
async function listJobs() {
  const response = await resumeServiceAxios.get("/jobs");
  return response.data;
}

/**
 * Get a single Job Description by ID.
 * @param {number} jobId
 */
async function getJob(jobId) {
  const response = await resumeServiceAxios.get(`/jobs/${jobId}`);
  return response.data;
}

// ── Resume Upload ─────────────────────────────────────────────────────────────

/**
 * Batch upload resume files for a specific job.
 * @param {number} jobId
 * @param {Express.Multer.File[]} files - Multer file objects
 */
async function uploadJobResumes(jobId, files) {
  const form = new FormData();
  for (const f of files) {
    form.append("files", f.buffer, {
      filename: f.originalname,
      contentType: f.mimetype,
    });
  }

  const response = await resumeServiceAxios.post(
    `/jobs/${jobId}/resumes/upload`,
    form,
    { headers: form.getHeaders() }
  );
  return response.data;
}

// ── ATS Screening ─────────────────────────────────────────────────────────────

/**
 * Screen a single resume against a job in real-time.
 * @param {Express.Multer.File} file
 * @param {{ job_title, job_description, experience_level_required }} params
 */
async function screenResume(file, params) {
  const form = new FormData();
  form.append("resume_file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  form.append("job_title", params.job_title);
  form.append("job_description", params.job_description);
  form.append(
    "experience_level_required",
    params.experience_level_required || "Mid"
  );

  const response = await resumeServiceAxios.post("/screen", form, {
    headers: form.getHeaders(),
  });
  return response.data;
}

/**
 * Batch screen multiple resumes against a job.
 * @param {Express.Multer.File[]} files
 * @param {{ job_title, job_description, experience_level_required }} params
 */
async function batchScreenResumes(files, params) {
  const form = new FormData();
  form.append("job_title", params.job_title);
  form.append("job_description", params.job_description);
  form.append(
    "experience_level_required",
    params.experience_level_required || "Mid"
  );
  for (const f of files) {
    form.append("files", f.buffer, {
      filename: f.originalname,
      contentType: f.mimetype,
    });
  }

  const response = await resumeServiceAxios.post("/batch-screen", form, {
    headers: form.getHeaders(),
  });
  return response.data;
}

// ── Rankings & Evaluations ────────────────────────────────────────────────────

/**
 * Retrieve ranked candidate evaluations for a job.
 * @param {number} jobId
 */
async function getJobRankings(jobId) {
  const response = await resumeServiceAxios.get(`/jobs/${jobId}/rankings`);
  return response.data;
}

/**
 * Screen an existing candidate profile against a job (persists to DB).
 * @param {number} jobId
 * @param {number} candidateId
 */
async function screenJobCandidate(jobId, candidateId) {
  const response = await resumeServiceAxios.post(
    `/jobs/${jobId}/candidates/${candidateId}/screen`
  );
  return response.data;
}

/**
 * Health check for the FastAPI microservice.
 */
async function healthCheck() {
  const response = await resumeServiceAxios.get("/health");
  return response.data;
}

// ── Phase 6: Benchmarks & Evaluations ─────────────────────────────────────────

/**
 * Retrieve latest benchmark telemetry report from the ATS microservice.
 */
async function getLatestBenchmarks() {
  const response = await resumeServiceAxios.get("/benchmarks/latest");
  return response.data;
}

/**
 * Execute an on-demand latency, classification, and security stress-test.
 */
async function runBenchmarks() {
  const response = await resumeServiceAxios.post("/benchmarks/run");
  return response.data;
}

/**
 * Retrieve candidate evaluation by autonomous interview token.
 * @param {string} token
 */
async function getEvaluationByToken(token) {
  const response = await resumeServiceAxios.get(`/evaluations/token/${encodeURIComponent(token)}`);
  return response.data;
}

/**
 * Retrieve candidate evaluation by ID.
 * @param {number} evaluationId
 */
async function getEvaluationById(evaluationId) {
  const response = await resumeServiceAxios.get(`/evaluations/${evaluationId}`);
  return response.data;
}

module.exports = {
  createJob,
  listJobs,
  getJob,
  uploadJobResumes,
  screenResume,
  batchScreenResumes,
  getJobRankings,
  screenJobCandidate,
  healthCheck,
  getLatestBenchmarks,
  runBenchmarks,
  getEvaluationByToken,
  getEvaluationById,
};


