const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  getCandidates,
  updateCandidateStatus,
  createInvitation,
  getInvitations,
  getInvitationByToken,
} = require("../controllers/recruiterController");

const router = express.Router();

// Candidate Screening Endpoints
router.get("/candidates", requireAuth, getCandidates);
router.patch("/candidates/:id/status", requireAuth, updateCandidateStatus);

// Recruiter Invitation Endpoints
router.post("/invitations", requireAuth, createInvitation);
router.get("/invitations", requireAuth, getInvitations);

module.exports = {
  recruiterRouter: router,
  publicInvitationHandler: getInvitationByToken,
};
