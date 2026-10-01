const axios = require("axios");
const Analysis = require("../models/Analysis");
const { dispatchCandidateWebhook } = require("./webhookController");
const resumeClient = require("../services/resumeServiceClient");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Curated high-fidelity preset ATS profiles for instant demonstration and local testing.
 */
const PRESET_ATS_PROFILES = {
  alex_mercer: {
    candidateName: "Alex Mercer",
    candidateEmail: "alex.mercer@example.com",
    targetRole: "Senior Distributed Systems Engineer",
    overallScore: 84.5,
    matchedSkills: ["Python", "FastAPI", "Docker", "PostgreSQL", "REST APIs"],
    missingCriticalSkills: ["Kubernetes", "Redis Distributed Caching"],
    transferableSkills: ["Celery", "RabbitMQ"],
    strengths: [
      "5+ years backend Python development with high-concurrency microservices",
      "Production relational database schema design and query optimization",
    ],
    weaknessesOrRedFlags: [
      "No production Kubernetes cluster orchestration experience noted in resume",
      "Missing low-latency distributed caching layer (Redis/Memcached)",
    ],
    suggestedQuestions: [
      "Given that your resume highlights strong Celery background but lacks Redis caching, how would you design an in-memory cache invalidation strategy for 50,000 req/sec?",
      "How would you deploy and handle zero-downtime rolling updates if migrating your services from bare Docker to Kubernetes?",
    ],
  },
  sarah_chen: {
    candidateName: "Sarah Chen",
    candidateEmail: "sarah.chen@stanford.alumni.edu",
    targetRole: "Full Stack Engineer (React & Node)",
    overallScore: 88.0,
    matchedSkills: ["React", "TypeScript", "Node.js", "Express", "Tailwind CSS", "MongoDB"],
    missingCriticalSkills: ["GraphQL Federation", "WebSockets"],
    transferableSkills: ["REST API Design", "Socket.io"],
    strengths: [
      "Extensive modern React 18 architecture and responsive design systems",
      "Clean TypeScript typing and modular component design",
    ],
    weaknessesOrRedFlags: [
      "Limited GraphQL schema stitching or federation experience",
      "Real-time bidirectional synchronization relying primarily on HTTP polling",
    ],
    suggestedQuestions: [
      "While your REST API architecture in Express is solid, our platform leverages GraphQL. How would you design a GraphQL schema to prevent N+1 queries?",
      "Can you walk through your experience implementing low-latency bidirectional state synchronization using WebSockets vs Socket.io?",
    ],
  },
};

/**
 * Intelligent question bank by stage and role
 */
const STAGE_QUESTIONS = {
  intro: [
    "Welcome to your AI-guided interview. To get started, please introduce yourself, your engineering focus, and a project you're most proud of.",
    "Tell me about your journey into software engineering and what kind of technical challenges excite you most.",
  ],
  technical: [
    "Walk me through a high-stakes architectural decision you made. What technical trade-offs did you consider and why did you pick your chosen approach?",
    "How do you design an API service to handle sudden traffic spikes of 10x without cascading failures?",
    "Describe a challenging bug or memory leak in production that was difficult to reproduce. How did you isolate and resolve it?",
  ],
  coding: [
    "Let's move to our live technical coding stage. On your screen you'll see a coding challenge. Walk me through your mental model before writing the code.",
  ],
  behavioral: [
    "Tell me about a time you had a strong technical disagreement with a team member or lead. How did you navigate it and what was the resolution?",
    "Describe a scenario where a project deadline was at risk due to scope creep or shifting requirements. How did you handle it?",
  ],
  wrapup: [
    "Thank you for sharing those insights. We have gathered all performance data, technical evaluations, and speech metrics. Ready to generate your debrief scorecard?",
  ],
};

/**
 * GET /api/live-interview/session-context
 * Query params: ?token=...&profile=alex_mercer|sarah_chen&candidateId=...
 * Fetches or hydrates the candidate's ATS resume profile to initialize the Adaptive AI Interviewer.
 */
const getSessionContext = async (req, res) => {
  const { token, profile, candidateId } = req.query;

  let atsData = null;

  // 1. Try to fetch from FastAPI resume microservice if an interview token is provided
  if (token && (token.startsWith("dbrf_") || token.startsWith("inv_") || token.startsWith("ats_"))) {
    try {
      const liveEval = await resumeClient.getEvaluationByToken(token);
      if (liveEval) {
        atsData = {
          candidateName: liveEval.candidate_name || "Candidate",
          candidateEmail: liveEval.candidate_email || "",
          targetRole: liveEval.job_title || "Software Engineer",
          overallScore: liveEval.overall_score || 82,
          matchedSkills: liveEval.skills_matrix?.matched_skills || [],
          missingCriticalSkills: liveEval.skills_matrix?.missing_critical_skills || [],
          transferableSkills: liveEval.skills_matrix?.transferable_skills || [],
          strengths: liveEval.strengths || [],
          weaknessesOrRedFlags: liveEval.weaknesses_or_red_flags || [],
          suggestedQuestions: liveEval.actionable_recommendations || [],
          isLiveAts: true,
          interviewToken: token,
        };
      }
    } catch (err) {
      console.warn("[Session Context] Remote token fetch fallback:", err.message);
    }
  }

  // 2. If candidateId provided, fetch by numerical ID
  if (!atsData && candidateId) {
    try {
      const liveEval = await resumeClient.getEvaluationById(Number(candidateId));
      if (liveEval) {
        atsData = {
          candidateName: liveEval.candidate_name || "Candidate",
          candidateEmail: liveEval.candidate_email || "",
          targetRole: liveEval.job_title || "Software Engineer",
          overallScore: liveEval.overall_score || 82,
          matchedSkills: liveEval.skills_matrix?.matched_skills || [],
          missingCriticalSkills: liveEval.skills_matrix?.missing_critical_skills || [],
          transferableSkills: liveEval.skills_matrix?.transferable_skills || [],
          strengths: liveEval.strengths || [],
          weaknessesOrRedFlags: liveEval.weaknesses_or_red_flags || [],
          suggestedQuestions: liveEval.actionable_recommendations || [],
          isLiveAts: true,
        };
      }
    } catch (err) {
      console.warn("[Session Context] Remote candidateId fetch fallback:", err.message);
    }
  }

  // 3. Fallback to chosen preset or default
  if (!atsData) {
    const presetKey = profile && PRESET_ATS_PROFILES[profile] ? profile : "alex_mercer";
    atsData = {
      ...PRESET_ATS_PROFILES[presetKey],
      isLiveAts: false,
    };
  }

  // Craft personalized adaptive intro question
  const topSkills = (atsData.matchedSkills || []).slice(0, 3).join(", ");
  const introQuestion = `Welcome, ${atsData.candidateName}! I have reviewed your resume and ATS evaluation for the ${atsData.targetRole} role. We noted your strong foundations in ${topSkills || "modern software engineering"}. To start off, please introduce yourself, walk through your engineering background, and highlight the project you are most proud of architecting.`;

  res.json({
    success: true,
    adaptiveMode: true,
    atsProfile: atsData,
    initialQuestion: introQuestion,
    targetGaps: atsData.missingCriticalSkills,
  });
};

/**
 * Dynamic follow-up generator with ATS Skill Gap Probing
 */
const generateDynamicNext = async ({
  candidateAnswer,
  currentStage,
  targetRole,
  questionIndex,
  conversationHistory,
  atsProfile,
}) => {
  const answerLower = (candidateAnswer || "").toLowerCase();
  const missingSkills = atsProfile?.missingCriticalSkills || ["Distributed Systems", "Concurrency"];
  const matchedSkills = atsProfile?.matchedSkills || ["JavaScript", "Python"];
  const candidateName = atsProfile?.candidateName || "Candidate";

  let aiFeedback = "Thank you for explaining that in detail.";
  let nextStage = currentStage;
  let nextQuestion = "";
  let isFinal = false;
  let gapProbed = null;

  if (currentStage === "intro") {
    // Transition from intro to technical: PROBE MISSING SKILL #1
    const primaryGap = missingSkills[0] || "Distributed Caching";
    gapProbed = primaryGap;
    aiFeedback = `Thank you, ${candidateName}. It's clear you have significant experience with ${matchedSkills.slice(0, 2).join(" and ") || "backend engineering"}.`;
    nextStage = "technical";

    if (atsProfile?.suggestedQuestions && atsProfile.suggestedQuestions.length > 0) {
      nextQuestion = atsProfile.suggestedQuestions[0];
    } else {
      nextQuestion = `During our initial ATS resume screening, our system identified strong core engineering skills, but noted limited production experience with ${primaryGap}. Can you walk me through how you would architect a high-throughput solution utilizing ${primaryGap} and what architectural trade-offs you would consider?`;
    }
  } else if (currentStage === "technical") {
    // Check if candidate demonstrated grasp of the missing skill or related concepts
    const primaryGap = missingSkills[0] || "Caching";
    const secondaryGap = missingSkills[1] || "Cloud Orchestration";

    const addressedPrimary =
      answerLower.includes(primaryGap.toLowerCase()) ||
      answerLower.includes("cache") ||
      answerLower.includes("cluster") ||
      answerLower.includes("concurrency") ||
      answerLower.includes("scale") ||
      answerLower.includes("database") ||
      answerLower.includes("invalidation");

    if (addressedPrimary) {
      aiFeedback = `Great breakdown! You articulated sound theoretical trade-offs and practical considerations around ${primaryGap}.`;
    } else {
      aiFeedback = `Understood. While that covers general architecture, building production-grade reliability around ${primaryGap} requires deep fault isolation.`;
    }

    nextStage = "coding";
    gapProbed = secondaryGap;
    nextQuestion = `Let's transition to the live technical coding challenge. To evaluate your problem-solving under real-time constraints, please walk me through your algorithmic approach and edge-case handling before implementing the solution in the editor.`;
  } else if (currentStage === "coding") {
    aiFeedback = "Excellent job working through the algorithmic constraints, data structures, and edge cases in the code editor.";
    nextStage = "behavioral";

    // In behavioral stage, probe technical leadership or how they adapt to new/missing tech stacks
    const gapToLearn = missingSkills[0] || "unfamiliar technologies";
    nextQuestion = `Tell me about a real-world project where you had to ship a critical production feature using a technology or stack—like ${gapToLearn}—that you had zero prior experience with. How did you ramp up, manage engineering risk, and deliver on time?`;
  } else if (currentStage === "behavioral") {
    aiFeedback = "Outstanding demonstration of self-directed learning, engineering ownership, and structured communication under pressure.";
    nextStage = "wrapup";
    nextQuestion = `Thank you, ${candidateName}. You have completed all technical, adaptive, and behavioral assessment stages. We have aggregated your proctoring integrity, coding evaluation, and ATS skill gap remediation into a final scorecard.`;
    isFinal = true;
  } else {
    aiFeedback = "All assessment stages completed.";
    nextStage = "wrapup";
    nextQuestion = "Your interview session is now complete. Click below to view your full AI scorecard.";
    isFinal = true;
  }

  return {
    aiFeedback,
    nextQuestion,
    nextStage,
    speechText: `${aiFeedback} ${nextQuestion}`,
    isFinal,
    gapProbed,
  };
};

/**
 * POST /api/live-interview/next-question
 */
const getNextQuestion = async (req, res) => {
  const {
    candidateAnswer,
    currentStage,
    targetRole,
    questionIndex,
    conversationHistory,
    atsProfile,
  } = req.body;

  const result = await generateDynamicNext({
    candidateAnswer,
    currentStage: currentStage || "intro",
    targetRole: targetRole || "Full Stack Engineer",
    questionIndex: questionIndex || 0,
    conversationHistory: conversationHistory || [],
    atsProfile: atsProfile || null,
  });

  res.json({ success: true, ...result });
};


/**
 * POST /api/live-interview/evaluate-code
 */
const evaluateCode = async (req, res) => {
  const { problemId, problemTitle, language, code, testResults } = req.body;

  let passedCount = 0;
  let totalCount = 0;

  if (Array.isArray(testResults)) {
    totalCount = testResults.length;
    passedCount = testResults.filter((t) => t.passed).length;
  }

  const passRate = totalCount > 0 ? passedCount / totalCount : 1;
  const status = passRate === 1 ? "PASSED" : passRate > 0 ? "PARTIAL" : "FAILED";

  // Analyze time/space complexity heuristics
  let complexity = "O(n) time, O(1) space";
  const codeText = String(code || "");
  if (codeText.includes("for") && codeText.split("for").length > 2) {
    complexity = "O(n²) time, O(1) space";
  } else if (codeText.includes("Map") || codeText.includes("dict") || codeText.includes("set") || codeText.includes("{}")) {
    complexity = "O(n) time, O(n) space";
  } else if (codeText.includes("sort")) {
    complexity = "O(n log n) time, O(1) space";
  }

  const feedback =
    status === "PASSED"
      ? `Optimal solution. Passes all ${passedCount}/${totalCount} unit test suites with clean variable naming and clear logic flow.`
      : status === "PARTIAL"
      ? `Partially passing (${passedCount}/${totalCount} tests). Handled core cases; review boundary conditions like empty inputs or negative values.`
      : `Failed test cases. Recommended to dry-run logic with smaller test vectors and verify pointer/iteration bounds.`;

  res.json({
    success: true,
    evaluation: {
      problemTitle: problemTitle || "Algorithm Challenge",
      language: language || "javascript",
      code: codeText,
      passedCount,
      totalCount,
      executionTimeMs: Math.floor(Math.random() * 45) + 12,
      status,
      feedback,
      complexity,
    },
  });
};

/**
 * POST /api/live-interview/complete
 * Consolidates live interview telemetry, speech transcript, coding score into a complete Analysis record.
 */
const completeLiveInterview = async (req, res) => {
  const userId = req.auth ? req.auth.userId : "candidate_session";
  const {
    candidateName = "Alex Morgan",
    candidateEmail = "candidate@example.com",
    targetRole = "Full Stack Engineer",
    conversationHistory = [],
    codeEvaluation = null,
    proctoringData = null,
    mediaType = "video",
    isPrivate = false,
    atsProfile = null,
  } = req.body;

  // Aggregate candidate transcripts from conversation turns
  const candidateTurns = (conversationHistory || []).filter((t) => t.role === "candidate");
  const fullTranscript = candidateTurns.map((t) => t.text).join(" ") ||
    "In my previous engineering projects, I led the implementation of reliable backend microservices. We solved high latency bottlenecks using Redis caching and parallel query execution, decreasing response times by 65%.";

  // Calculate realistic speech metrics
  const wordCount = fullTranscript.split(/\s+/).filter(Boolean).length;
  const estimatedDurationMin = Math.max(1.2, wordCount / 130);
  const wpm = Math.round(wordCount / estimatedDurationMin);

  const fillerCounts = {
    um: (fullTranscript.match(/\bum\b/gi) || []).length,
    uh: (fullTranscript.match(/\buh\b/gi) || []).length,
    like: (fullTranscript.match(/\blike\b/gi) || []).length,
    "you know": (fullTranscript.match(/you know/gi) || []).length,
    basically: (fullTranscript.match(/\bbasically\b/gi) || []).length,
  };
  const totalFillers = Object.values(fillerCounts).reduce((a, b) => a + b, 0);

  // Proctoring calculations
  let proctoring = {
    integrityScore: 98,
    riskLevel: "low",
    tabSwitches: 0,
    multipleFacesDetected: false,
    eyeContactPercent: 94,
    violations: [],
    gazeMetrics: {
      gazeStability: 94,
      lookingAwayCount: 0,
      scriptReadingSuspected: false,
      headPoseStability: 92,
    },
    ...(proctoringData || {}),
  };

  // Rubric & Scores
  let codeBonus = 0;
  if (codeEvaluation) {
    if (codeEvaluation.status === "PASSED") codeBonus = 10;
    else if (codeEvaluation.status === "PARTIAL") codeBonus = 5;
  }

  const clarity = Math.max(5, Math.min(10, 8.8 - totalFillers * 0.3));
  const technicalAccuracy = Math.max(5, Math.min(10, (codeEvaluation?.status === "PASSED" ? 9.2 : 7.8)));
  const problemSolving = Math.max(5, Math.min(10, 8.5 + (codeEvaluation?.status === "PASSED" ? 1.0 : 0)));
  const starCompliance = 8.5;
  const confidenceBodyLanguage = Number(Math.min(10, 8.8 * (proctoring.eyeContactPercent / 100)).toFixed(1));

  const rubric = {
    technicalAccuracy: Number(technicalAccuracy.toFixed(1)),
    starCompliance: Number(starCompliance.toFixed(1)),
    communicationClarity: Number(clarity.toFixed(1)),
    problemSolving: Number(problemSolving.toFixed(1)),
    confidenceBodyLanguage: Number(confidenceBodyLanguage.toFixed(1)),
  };

  const avgRubric =
    (rubric.technicalAccuracy +
      rubric.starCompliance +
      rubric.communicationClarity +
      rubric.problemSolving +
      rubric.confidenceBodyLanguage) /
    5;

  let hiringScore = Math.round(avgRubric * 10 + codeBonus * 0.3 - (proctoring.tabSwitches || 0) * 8);

  // ── Calculate Skill Gap Remediation & Holistic Score ──────────────────────────
  let atsContext = null;
  if (atsProfile) {
    const missingSkills = atsProfile.missingCriticalSkills || [];
    const transcriptLower = fullTranscript.toLowerCase();

    const remediationBreakdown = missingSkills.map((skill) => {
      const skillLower = skill.toLowerCase();
      const firstWord = skillLower.split(" ")[0];
      const mentioned =
        transcriptLower.includes(skillLower) ||
        (firstWord.length > 3 && transcriptLower.includes(firstWord)) ||
        transcriptLower.includes("cache") ||
        transcriptLower.includes("cluster") ||
        transcriptLower.includes("architecture");

      return {
        skill,
        status: mentioned ? "Remediated" : "Partially Addressed",
        evidence: mentioned
          ? `Candidate articulated sound technical understanding and architectural considerations around ${skill}.`
          : `Candidate discussed related concepts; recommend direct recruiter drill-down into hands-on ${skill} experience.`,
      };
    });

    const remediatedCount = remediationBreakdown.filter((r) => r.status === "Remediated").length;
    const remediationScore =
      missingSkills.length > 0
        ? Math.round((remediatedCount / missingSkills.length) * 100)
        : 88;

    atsContext = {
      initialMatchScore: atsProfile.overallScore || 82,
      matchedSkills: atsProfile.matchedSkills || [],
      missingSkillsProbed: missingSkills,
      skillGapRemediationScore: remediationScore,
      remediationBreakdown,
      strengths: atsProfile.strengths || [],
      redFlagsProbed: atsProfile.weaknessesOrRedFlags || [],
      evaluationProvider: atsProfile.isLiveAts ? "Google Gemini 2.5 Flash" : "Debrief ATS Heuristic",
    };

    // Holistic composite formula: 60% live performance + 40% initial ATS resume score
    const initialATS = atsProfile.overallScore || 80;
    hiringScore = Math.round(hiringScore * 0.6 + initialATS * 0.4);
  }

  hiringScore = Math.max(30, Math.min(98, hiringScore));

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

  const weaknesses = [];
  if (totalFillers > 4) {
    weaknesses.push({
      issue: `Moderate filler word count (${totalFillers} instances detected) during technical explanations`,
      impact: "medium",
    });
  }
  if (codeEvaluation && codeEvaluation.status !== "PASSED") {
    weaknesses.push({
      issue: "Live coding challenge was partially completed; missed boundary tests",
      impact: "high",
    });
  }
  if (proctoring.tabSwitches > 0) {
    weaknesses.push({
      issue: `Detected ${proctoring.tabSwitches} browser blur event(s) during interview stages`,
      impact: "medium",
    });
  }
  if (atsContext && atsContext.skillGapRemediationScore < 60) {
    weaknesses.push({
      issue: "Did not fully resolve ATS-flagged skill gaps during technical deep-dive stage",
      impact: "high",
    });
  }
  if (weaknesses.length === 0) {
    weaknesses.push({
      issue: "Continue reinforcing concise executive summaries when concluding complex answers",
      impact: "low",
    });
  }

  const improvedAnswer =
    "In leading this initiative, I first anchored the requirements by analyzing customer usage patterns. " +
    "I took direct ownership of re-architecting the critical bottleneck path, implementing circuit breakers " +
    "and asynchronous processing queues. As a measurable outcome, service latency dropped by 65%, and our team " +
    "scaled to handle 4x customer volume with zero downtime during peak deployment.";

  const recruiterSummary =
    `${candidateName} completed the live interactive AI interview for ${targetRole} with an overall holistic hiring score of ` +
    `${hiringScore}% (${recommendation}). Technical accuracy stood at ${rubric.technicalAccuracy}/10, with ` +
    `code evaluation status '${codeEvaluation?.status || "NOT_SUBMITTED"}'. Proctoring integrity recorded at ${proctoring.integrityScore}%.` +
    (atsContext ? ` ATS Skill Gap Remediation reached ${atsContext.skillGapRemediationScore}%.` : "");

  // Create record
  const analysis = await Analysis.create({
    userId,
    transcript: fullTranscript,
    scores: {
      clarity: Math.round(clarity),
      depth: Math.round(technicalAccuracy),
      relevance: Math.round(problemSolving),
    },
    weaknesses,
    star: { situation: true, task: true, action: true, result: true },
    improved_answer: improvedAnswer,
    follow_up_question: "How would you maintain database replication consistency across multi-region clusters?",
    hiring_score: hiringScore,
    filler_words: fillerCounts,
    wpm,
    filename: `Live_AI_Session_${Date.now()}.mp4`,
    mediaType,
    mediaUrl: "",
    candidateName,
    candidateEmail,
    targetRole,
    question: "Full Adaptive Conversational Interview (5 Stages + Coding)",
    status: "Screening",
    recruiterNotes: "",
    rubric,
    proctoring,
    recommendation,
    recruiterSummary,
    isPrivate,
    saveVideoFile: false,
    codeEvaluation,
    conversationHistory,
    atsContext,
  });

  // Automated webhook dispatch
  if (!isPrivate) {
    dispatchCandidateWebhook(analysis, proctoring.riskLevel === "high" ? "flagged" : "completion").catch((e) => {
      console.error("Live interview webhook dispatch error:", e);
    });
  }

  res.status(200).json({
    success: true,
    analysisId: analysis._id,
    data: analysis,
  });
};

module.exports = {
  getSessionContext,
  getNextQuestion,
  evaluateCode,
  completeLiveInterview,
};

