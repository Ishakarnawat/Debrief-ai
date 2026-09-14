import axios from "axios";

/**
 * Debrief.ai — ATS Screener Frontend Client Service
 * Phase 5: Modern Recruiter UI Integration
 *
 * Provides typed convenience methods to interact with both:
 * 1. The Phase 4 Node.js Express Gateway (/api/recruiter/ats/*)
 * 2. The FastAPI ATS Microservice (/api/v1/*) as direct fallback
 */

async function getHeaders(getToken) {
  let token = "demo_mock_jwt_token";
  if (getToken && typeof getToken === "function") {
    try {
      const fetched = await getToken();
      if (fetched) token = fetched;
    } catch {
      // ignore, use fallback
    }
  }
  return {
    Authorization: `Bearer ${token}`,
    "x-demo-user-id": "demo_user",
  };
}

/**
 * Checks the operational health of the ATS microservice.
 */
export async function checkAtsHealth() {
  try {
    const res = await axios.get("/api/recruiter/ats/health", { timeout: 4000 });
    return res.data;
  } catch {
    // Direct fallback
    const directRes = await axios.get("/api/v1/health", { timeout: 4000 });
    return directRes.data;
  }
}

/**
 * Retrieves all stored job descriptions from PostgreSQL.
 */
export async function fetchJobs(getToken) {
  const headers = await getHeaders(getToken);
  try {
    const res = await axios.get("/api/recruiter/ats/jobs", { headers });
    return res.data;
  } catch {
    const fallback = await axios.get("/api/v1/jobs");
    return fallback.data;
  }
}

/**
 * Creates a new Job Description record.
 */
export async function createJob(jobData, getToken) {
  const headers = await getHeaders(getToken);
  try {
    const res = await axios.post("/api/recruiter/ats/jobs", jobData, { headers });
    return res.data;
  } catch {
    const fallback = await axios.post("/api/v1/jobs", jobData);
    return fallback.data;
  }
}

/**
 * Retrieves ATS-ranked candidate evaluations for a job.
 */
export async function fetchJobRankings(jobId, getToken) {
  const headers = await getHeaders(getToken);
  try {
    const res = await axios.get(`/api/recruiter/ats/jobs/${jobId}/rankings`, { headers });
    return res.data;
  } catch {
    const fallback = await axios.get(`/api/v1/jobs/${jobId}/rankings`);
    return fallback.data;
  }
}

/**
 * Screens a single resume in real-time.
 */
export async function screenSingleResume(formData, getToken) {
  const headers = await getHeaders(getToken);
  try {
    const res = await axios.post("/api/recruiter/ats/screen", formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
      timeout: 90000,
    });
    return res.data;
  } catch {
    // Fallback directly to FastAPI microservice proxy
    const fallback = await axios.post("/api/v1/screen", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 90000,
    });
    return fallback.data;
  }
}

/**
 * Batch screens multiple resumes against a job description.
 * Supports onUploadProgress callback for live progression bar.
 */
export async function batchScreenResumes({
  jobId,
  jobTitle,
  jobDescription,
  experienceLevel = "Mid",
  files,
  getToken,
  onUploadProgress,
}) {
  const headers = await getHeaders(getToken);
  const formData = new FormData();
  formData.append("job_title", jobTitle);
  formData.append("job_description", jobDescription);
  formData.append("experience_level_required", experienceLevel);

  files.forEach((file) => {
    // In Node gateway it's "resumes", in FastAPI it's "files"
    formData.append("resumes", file);
    formData.append("files", file);
  });

  const uploadEndpoint = jobId
    ? `/api/recruiter/ats/jobs/${jobId}/screen-resumes`
    : "/api/v1/batch-screen";

  try {
    const res = await axios.post(uploadEndpoint, formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000,
      onUploadProgress: (evt) => {
        if (evt.total && onUploadProgress) {
          const percent = Math.round((evt.loaded * 100) / evt.total);
          onUploadProgress(percent);
        }
      },
    });
    return res.data;
  } catch (err) {
    // If gateway route failed or 404, try FastAPI /batch-screen directly
    const fallbackFormData = new FormData();
    fallbackFormData.append("job_title", jobTitle);
    fallbackFormData.append("job_description", jobDescription);
    fallbackFormData.append("experience_level_required", experienceLevel);
    files.forEach((f) => fallbackFormData.append("files", f));

    const fallbackRes = await axios.post("/api/v1/batch-screen", fallbackFormData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
      onUploadProgress: (evt) => {
        if (evt.total && onUploadProgress) {
          const percent = Math.round((evt.loaded * 100) / evt.total);
          onUploadProgress(percent);
        }
      },
    });
    return fallbackRes.data;
  }
}

/**
 * Ingests and parses document text and sanitization metadata for quick inspection.
 */
export async function parseDocumentPreview(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post("/api/v1/resumes/parse", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
