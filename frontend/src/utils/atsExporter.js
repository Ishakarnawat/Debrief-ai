/**
 * atsExporter.js
 * Utilities for exporting candidate assessment records into standard ATS formats
 * (Greenhouse, Lever, and universal JSON schema).
 */

/**
 * Escapes values for safe CSV inclusion
 */
function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates a Greenhouse-compatible CSV string
 */
export function generateGreenhouseCSV(candidates) {
  const headers = [
    "Candidate Name",
    "Candidate Email",
    "Target Job Role",
    "Overall Hiring Score",
    "Recommendation",
    "Proctoring Integrity Score",
    "Proctoring Risk Level",
    "Tab Switches",
    "Gaze Stability (%)",
    "Script Reading Suspected",
    "Technical Accuracy (1-10)",
    "Communication Clarity (1-10)",
    "Problem Solving (1-10)",
    "STAR Compliance (1-10)",
    "Confidence Body Language (1-10)",
    "Coding Challenge Status",
    "Coding Problem",
    "Coding Complexity",
    "Speaking Pace (WPM)",
    "Filler Words Count",
    "Assessment Date",
    "Debrief Assessment ID",
  ];

  const rows = candidates.map((c) => {
    const rubric = c.rubric || {};
    const proctoring = c.proctoring || {};
    const gaze = proctoring.gazeMetrics || {};
    const code = c.codeEvaluation || {};
    const fillerTotal = Object.values(c.filler_words || {}).reduce((a, b) => a + b, 0);

    return [
      escapeCSV(c.candidateName || "Candidate"),
      escapeCSV(c.candidateEmail || "N/A"),
      escapeCSV(c.targetRole || "Software Engineer"),
      escapeCSV(Math.round(c.hiring_score || 0)),
      escapeCSV(c.recommendation || (c.hiring_score >= 80 ? "Strong Hire" : "Hire")),
      escapeCSV(proctoring.integrityScore ?? 100),
      escapeCSV(proctoring.riskLevel || "low"),
      escapeCSV(proctoring.tabSwitches || 0),
      escapeCSV(gaze.gazeStability ?? proctoring.eyeContactPercent ?? 92),
      escapeCSV(gaze.scriptReadingSuspected ? "YES" : "NO"),
      escapeCSV(rubric.technicalAccuracy ?? 7.5),
      escapeCSV(rubric.communicationClarity ?? 7.8),
      escapeCSV(rubric.problemSolving ?? 8.0),
      escapeCSV(rubric.starCompliance ?? 7.5),
      escapeCSV(rubric.confidenceBodyLanguage ?? 8.0),
      escapeCSV(code.status || "N/A"),
      escapeCSV(code.problemTitle || "N/A"),
      escapeCSV(code.complexity || "N/A"),
      escapeCSV(Math.round(c.wpm || 0)),
      escapeCSV(fillerTotal),
      escapeCSV(new Date(c.createdAt || Date.now()).toISOString().split("T")[0]),
      escapeCSV(c._id || c.analysisId || "N/A"),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

/**
 * Generates a Lever-compatible CSV string
 */
export function generateLeverCSV(candidates) {
  const headers = [
    "candidate_name",
    "email",
    "posting_title",
    "overall_score",
    "hiring_verdict",
    "proctoring_status",
    "tech_score",
    "communication_score",
    "problem_solving_score",
    "coding_test_result",
    "interview_date",
    "external_profile_url",
  ];

  const rows = candidates.map((c) => {
    const rubric = c.rubric || {};
    const proctoring = c.proctoring || {};
    const code = c.codeEvaluation || {};

    return [
      escapeCSV(c.candidateName || "Candidate"),
      escapeCSV(c.candidateEmail || "N/A"),
      escapeCSV(c.targetRole || "Software Engineer"),
      escapeCSV(Math.round(c.hiring_score || 0)),
      escapeCSV(c.recommendation || "Hire"),
      escapeCSV(proctoring.riskLevel === "high" ? "FLAGGED" : "PASSED"),
      escapeCSV(rubric.technicalAccuracy ?? 7.5),
      escapeCSV(rubric.communicationClarity ?? 7.8),
      escapeCSV(rubric.problemSolving ?? 8.0),
      escapeCSV(code.status ? `${code.status} (${code.passedCount || 0}/${code.totalCount || 0})` : "NOT_TESTED"),
      escapeCSV(new Date(c.createdAt || Date.now()).toISOString()),
      escapeCSV(window.location.origin + `/interview/results/${c._id || c.analysisId}`),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

/**
 * Generates a standardized JSON payload for modern ATS APIs (Workday, Ashby, BambooHR)
 */
export function generateATSJSON(candidates) {
  return {
    exportVersion: "2.0",
    generatedAt: new Date().toISOString(),
    sourcePlatform: "Debrief.ai Pro Enterprise",
    candidateCount: candidates.length,
    candidates: candidates.map((c) => ({
      id: c._id || c.analysisId,
      name: c.candidateName,
      email: c.candidateEmail,
      targetRole: c.targetRole,
      status: c.status || "COMPLETED",
      hiringScore: Math.round(c.hiring_score || 0),
      recommendation: c.recommendation || "Hire",
      assessmentDate: c.createdAt,
      competencies: {
        technicalAccuracy: c.rubric?.technicalAccuracy ?? 7.5,
        communicationClarity: c.rubric?.communicationClarity ?? 7.8,
        problemSolving: c.rubric?.problemSolving ?? 8.0,
        starCompliance: c.rubric?.starCompliance ?? 7.5,
        confidenceBodyLanguage: c.rubric?.confidenceBodyLanguage ?? 8.0,
      },
      proctoring: {
        integrityScore: c.proctoring?.integrityScore ?? 100,
        riskLevel: c.proctoring?.riskLevel || "low",
        tabSwitches: c.proctoring?.tabSwitches || 0,
        eyeContactPercent: c.proctoring?.eyeContactPercent ?? 92,
        gazeStability: c.proctoring?.gazeMetrics?.gazeStability ?? 92,
        scriptReadingSuspected: c.proctoring?.gazeMetrics?.scriptReadingSuspected || false,
        headPoseStability: c.proctoring?.gazeMetrics?.headPoseStability ?? 95,
        multipleFacesDetected: c.proctoring?.multipleFacesDetected || false,
      },
      codingEvaluation: c.codeEvaluation || null,
      speechMetrics: {
        wpm: Math.round(c.wpm || 0),
        fillerWordsCount: Object.values(c.filler_words || {}).reduce((a, b) => a + b, 0),
      },
      recruiterNotes: c.recruiterNotes || "",
    })),
  };
}

/**
 * Triggers a client-side file download for CSV
 */
export function downloadCSV(filename, csvString) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a client-side file download for JSON
 */
export function downloadJSON(filename, jsonData) {
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
