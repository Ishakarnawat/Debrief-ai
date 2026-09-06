const Analysis = require("../models/Analysis");
const Invitation = require("../models/Invitation");

/**
 * GET /api/recruiter/candidates
 * Fetches all screened candidates with search, filter, and aggregate KPI statistics.
 */
const getCandidates = async (req, res) => {
  const { status, riskLevel, role, search, sortBy } = req.query;

  let query = {
    isPrivate: { $ne: true },
  };

  if (status && status !== "all") {
    query.status = status;
  }

  if (role && role !== "all") {
    query.targetRole = role;
  }

  // Fetch all non-private candidate analyses
  let sortObj = { createdAt: -1 };
  if (sortBy === "hiring_score") {
    sortObj = { hiring_score: -1 };
  } else if (sortBy === "integrity_score") {
    sortObj = { "proctoring.integrityScore": -1 };
  }

  const allCandidates = await Analysis.find(query).sort(sortObj).lean();

  // In-memory post-filtering (strict privacy check: exclude any private sessions)
  let filtered = allCandidates.filter((c) => c.isPrivate !== true);

  if (riskLevel && riskLevel !== "all") {
    filtered = filtered.filter((c) => {
      const candidateRisk = c.proctoring?.riskLevel || "low";
      if (riskLevel === "flagged") {
        return candidateRisk === "high" || (c.proctoring?.tabSwitches || 0) > 0 || c.proctoring?.multipleFacesDetected;
      }
      return candidateRisk === riskLevel;
    });
  }

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        (c.candidateName && c.candidateName.toLowerCase().includes(q)) ||
        (c.candidateEmail && c.candidateEmail.toLowerCase().includes(q)) ||
        (c.targetRole && c.targetRole.toLowerCase().includes(q)) ||
        (c.question && c.question.toLowerCase().includes(q))
    );
  }

  // Calculate high-level KPIs across all candidates
  const total = allCandidates.length;
  const avgScore =
    total > 0
      ? Math.round(
          allCandidates.reduce((acc, c) => acc + (c.hiring_score || 0), 0) / total
        )
      : 0;
  const shortlisted = allCandidates.filter((c) => c.status === "Shortlisted").length;
  const flagged = allCandidates.filter(
    (c) =>
      c.proctoring?.riskLevel === "high" ||
      (c.proctoring?.tabSwitches || 0) >= 2 ||
      c.proctoring?.multipleFacesDetected
  ).length;

  res.json({
    success: true,
    data: filtered,
    stats: {
      totalCandidates: total,
      avgHiringScore: avgScore,
      shortlistedCount: shortlisted,
      flaggedCount: flagged,
    },
  });
};

/**
 * PATCH /api/recruiter/candidates/:id/status
 * Updates candidate status (e.g. Shortlisted, Rejected) and recruiter notes.
 */
const updateCandidateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, recruiterNotes } = req.body;

  const updateFields = {};
  if (status !== undefined) updateFields.status = status;
  if (recruiterNotes !== undefined) updateFields.recruiterNotes = recruiterNotes;

  const updated = await Analysis.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ error: "Candidate assessment not found" });
  }

  res.json({ success: true, data: updated });
};

/**
 * POST /api/recruiter/invitations
 * Creates a unique candidate screening link.
 */
const createInvitation = async (req, res) => {
  const { role, companyName, questions, candidateEmail, strictMode } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Target job role is required" });
  }

  const token = "inv_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  const invitation = await Invitation.create({
    token,
    role,
    companyName: companyName || "Debrief.ai Partner",
    questions: questions && questions.length > 0 ? questions : [
      "Tell me about a time you solved a major technical bottleneck.",
      "Describe a situation where you had to lead through uncertainty.",
    ],
    candidateEmail: candidateEmail || "",
    strictMode: Boolean(strictMode),
    proctoringEnabled: true,
    status: "active",
  });

  res.status(201).json({
    success: true,
    data: invitation,
    inviteUrl: `/interview/${token}`,
  });
};

/**
 * GET /api/recruiter/invitations
 * Lists all active interview invitations.
 */
const getInvitations = async (req, res) => {
  const invites = await Invitation.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: invites });
};

/**
 * GET /api/invitations/:token
 * Public endpoint to fetch invitation details for a candidate.
 */
const getInvitationByToken = async (req, res) => {
  const { token } = req.params;
  const invitation = await Invitation.findOne({ token }).lean();

  if (!invitation) {
    return res.status(404).json({ error: "Invalid or expired interview link." });
  }

  res.json({ success: true, data: invitation });
};

/**
 * POST /api/recruiter/candidates/compare
 * Body: { candidateIds: string[] }
 * Returns comparative metrics, category leaders, and deltas between chosen candidates.
 */
const compareCandidates = async (req, res) => {
  try {
    const { candidateIds } = req.body;
    if (!Array.isArray(candidateIds) || candidateIds.length < 2) {
      return res.status(400).json({ error: "At least two candidate IDs required for comparison." });
    }

    const candidates = await Analysis.find({
      _id: { $in: candidateIds },
      isPrivate: { $ne: true },
    }).lean();

    if (candidates.length < 2) {
      return res.status(404).json({ error: "Could not find enough valid candidates to compare." });
    }

    // Determine category leaders
    const dimensions = [
      { key: "technicalAccuracy", label: "Tech Accuracy" },
      { key: "communicationClarity", label: "Communication" },
      { key: "problemSolving", label: "Problem Solving" },
      { key: "starCompliance", label: "STAR Method" },
      { key: "confidenceBodyLanguage", label: "Confidence" },
    ];

    const leaders = {};
    dimensions.forEach((dim) => {
      let maxScore = -1;
      let winner = null;
      candidates.forEach((c) => {
        const score = c.rubric?.[dim.key] ?? 7.5;
        if (score > maxScore) {
          maxScore = score;
          winner = { id: c._id, name: c.candidateName, score };
        }
      });
      leaders[dim.key] = winner;
    });

    // Determine top overall scorer
    const sorted = [...candidates].sort((a, b) => (b.hiring_score || 0) - (a.hiring_score || 0));
    const topPerformer = sorted[0];

    res.json({
      success: true,
      data: {
        candidates,
        topPerformer: {
          id: topPerformer._id,
          name: topPerformer.candidateName,
          score: topPerformer.hiring_score,
          role: topPerformer.targetRole,
        },
        leaders,
        candidateCount: candidates.length,
      },
    });
  } catch (err) {
    console.error("Comparison Error:", err);
    res.status(500).json({ error: "Failed to compare candidates." });
  }
};

/**
 * POST /api/recruiter/candidates/export-ats
 * Body: { candidateIds: string[], format: "csv" | "json", atsTarget: "greenhouse" | "lever" | "generic" }
 * Exports candidates to Greenhouse / Lever CSV or standard ATS JSON.
 */
const exportCandidatesATS = async (req, res) => {
  try {
    const { candidateIds, format = "csv", atsTarget = "greenhouse" } = req.body;
    let query = { isPrivate: { $ne: true } };
    if (Array.isArray(candidateIds) && candidateIds.length > 0) {
      query._id = { $in: candidateIds };
    }

    const candidates = await Analysis.find(query).sort({ createdAt: -1 }).lean();

    if (format === "json") {
      return res.json({
        success: true,
        exportVersion: "2.0",
        atsTarget,
        generatedAt: new Date().toISOString(),
        candidateCount: candidates.length,
        candidates: candidates.map((c) => ({
          id: c._id,
          name: c.candidateName,
          email: c.candidateEmail,
          role: c.targetRole,
          hiringScore: c.hiring_score,
          recommendation: c.recommendation,
          rubric: c.rubric,
          proctoring: c.proctoring,
          codeEvaluation: c.codeEvaluation,
          date: c.createdAt,
        })),
      });
    }

    // Default CSV Generation
    const escape = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    let csvContent = "";
    if (atsTarget === "lever") {
      const headers = [
        "candidate_name",
        "email",
        "posting_title",
        "overall_score",
        "verdict",
        "integrity_score",
        "date",
      ];
      const rows = candidates.map((c) =>
        [
          escape(c.candidateName),
          escape(c.candidateEmail),
          escape(c.targetRole),
          escape(c.hiring_score),
          escape(c.recommendation),
          escape(c.proctoring?.integrityScore || 100),
          escape(new Date(c.createdAt).toISOString()),
        ].join(",")
      );
      csvContent = [headers.join(","), ...rows].join("\r\n");
    } else {
      // Greenhouse / Standard format
      const headers = [
        "Candidate Name",
        "Email",
        "Target Role",
        "Hiring Score",
        "Recommendation",
        "Integrity Score",
        "Risk Level",
        "Tech Score",
        "Communication Score",
        "Problem Solving",
        "Date",
      ];
      const rows = candidates.map((c) =>
        [
          escape(c.candidateName),
          escape(c.candidateEmail),
          escape(c.targetRole),
          escape(c.hiring_score),
          escape(c.recommendation),
          escape(c.proctoring?.integrityScore || 100),
          escape(c.proctoring?.riskLevel || "low"),
          escape(c.rubric?.technicalAccuracy || 7.5),
          escape(c.rubric?.communicationClarity || 7.8),
          escape(c.rubric?.problemSolving || 8.0),
          escape(new Date(c.createdAt).toISOString().split("T")[0]),
        ].join(",")
      );
      csvContent = [headers.join(","), ...rows].join("\r\n");
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ats-export-${atsTarget}-${Date.now()}.csv"`
    );
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error("ATS Export Error:", err);
    res.status(500).json({ error: "Failed to generate ATS export." });
  }
};

module.exports = {
  getCandidates,
  updateCandidateStatus,
  createInvitation,
  getInvitations,
  getInvitationByToken,
  compareCandidates,
  exportCandidatesATS,
};
