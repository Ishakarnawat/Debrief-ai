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

module.exports = {
  getCandidates,
  updateCandidateStatus,
  createInvitation,
  getInvitations,
  getInvitationByToken,
};
