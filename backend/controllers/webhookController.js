const axios = require("axios");
const WebhookSetting = require("../models/WebhookSetting");

/**
 * Formats a rich notification payload for Slack / Discord / Custom
 */
const formatPayload = (platform, event, data) => {
  const candidateName = data.candidateName || "Candidate";
  const role = data.targetRole || "Software Engineer";
  const score = Math.round(data.hiring_score ?? 0);
  const integrity = data.proctoring?.integrityScore ?? 100;
  const risk = (data.proctoring?.riskLevel || "low").toUpperCase();
  const recommendation = data.recommendation || "Pending";

  const title =
    event === "test"
      ? "🔔 [Debrief.ai Test Alert] Recruiter Webhook Connected"
      : event === "flagged"
      ? `🚨 [Proctoring Alert] ${candidateName} flagged during ${role} interview`
      : `🎯 [Assessment Complete] ${candidateName} completed ${role} interview`;

  if (platform === "slack") {
    return {
      text: title,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: title,
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Candidate:*\n${candidateName}` },
            { type: "mrkdwn", text: `*Target Role:*\n${role}` },
            { type: "mrkdwn", text: `*Hiring Score:*\n${score}% (${recommendation})` },
            { type: "mrkdwn", text: `*Proctoring Integrity:*\n${integrity}% (${risk} Risk)` },
          ],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Debrief.ai Pro Automated Recruiter Dispatch • ${new Date().toLocaleString()}`,
            },
          ],
        },
      ],
    };
  }

  if (platform === "discord") {
    return {
      content: title,
      embeds: [
        {
          title,
          color: risk === "HIGH" ? 0xff3b30 : score >= 75 ? 0x34c759 : 0x007aff,
          fields: [
            { name: "Candidate", value: candidateName, inline: true },
            { name: "Target Role", value: role, inline: true },
            { name: "Hiring Score", value: `${score}% (${recommendation})`, inline: true },
            { name: "Integrity", value: `${integrity}% (${risk})`, inline: true },
          ],
          footer: { text: "Debrief.ai Recruiter Notification Service" },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  // Custom JSON
  return {
    source: "debrief.ai",
    event,
    timestamp: new Date().toISOString(),
    candidate: {
      name: candidateName,
      email: data.candidateEmail || "",
      role,
      hiringScore: score,
      recommendation,
      integrityScore: integrity,
      riskLevel: risk,
    },
  };
};

/**
 * GET /api/recruiter/webhooks
 */
const getSettings = async (req, res) => {
  const settings = await WebhookSetting.findOne({ userId: "recruiter" });
  res.json({ success: true, data: settings });
};

/**
 * POST /api/recruiter/webhooks
 */
const updateSettings = async (req, res) => {
  const { platform, webhookUrl, emailAlertsTo, events, enabled } = req.body;

  const update = {
    $set: {
      ...(platform !== undefined && { platform }),
      ...(webhookUrl !== undefined && { webhookUrl }),
      ...(emailAlertsTo !== undefined && { emailAlertsTo }),
      ...(events !== undefined && { events }),
      ...(enabled !== undefined && { enabled }),
    },
  };

  const updated = await WebhookSetting.findOneAndUpdate({ userId: "recruiter" }, update, {
    new: true,
  });

  res.json({ success: true, data: updated });
};

/**
 * POST /api/recruiter/webhooks/test
 */
const testWebhook = async (req, res) => {
  const settings = await WebhookSetting.findOne({ userId: "recruiter" });
  const targetUrl = req.body.webhookUrl || settings.webhookUrl;
  const platform = req.body.platform || settings.platform || "slack";

  const sampleData = {
    candidateName: "Alex Morgan (Test Sample)",
    targetRole: "Senior Full-Stack Engineer",
    hiring_score: 88,
    recommendation: "Strong Hire",
    proctoring: {
      integrityScore: 96,
      riskLevel: "low",
    },
  };

  const payload = formatPayload(platform, "test", sampleData);

  let success = false;
  let statusCode = 200;
  let summary = "";

  if (targetUrl && targetUrl.startsWith("http")) {
    try {
      const resp = await axios.post(targetUrl, payload, { timeout: 8000 });
      statusCode = resp.status;
      success = resp.status >= 200 && resp.status < 300;
      summary = `Delivered HTTP ${resp.status} to ${targetUrl.substring(0, 30)}...`;
    } catch (err) {
      statusCode = err.response ? err.response.status : 500;
      summary = `Delivery failed (${err.message}): ${targetUrl.substring(0, 30)}...`;
      success = false;
    }
  } else {
    // Simulated dispatch when webhook URL is not yet configured or is in sandbox mode
    success = true;
    statusCode = 200;
    summary = `Simulated webhook delivery (${platform.toUpperCase()}) successful (sandbox mode).`;
  }

  const logEntry = {
    timestamp: new Date(),
    event: "test_ping",
    status: success ? "success" : "failed",
    statusCode,
    summary,
  };

  await WebhookSetting.findOneAndUpdate(
    { userId: "recruiter" },
    {
      $set: {
        lastDispatchedAt: new Date(),
        lastStatus: success ? "active" : "error",
      },
      $inc: { dispatchCount: 1 },
      $push: { logs: logEntry },
    }
  );

  res.json({
    success,
    statusCode,
    summary,
    payload,
    logEntry,
  });
};

/**
 * Dispatch helper called upon interview completion
 */
const dispatchCandidateWebhook = async (analysis, eventType = "completion") => {
  try {
    const settings = await WebhookSetting.findOne({ userId: "recruiter" });
    if (!settings || !settings.enabled) return null;

    if (eventType === "completion" && !settings.events?.onAssessmentCompleted) return null;
    if (eventType === "flagged" && !settings.events?.onCheatingFlagged) return null;

    const payload = formatPayload(settings.platform, eventType, analysis);

    let success = false;
    let statusCode = 200;
    let summary = "";

    if (settings.webhookUrl && settings.webhookUrl.startsWith("http")) {
      try {
        const resp = await axios.post(settings.webhookUrl, payload, { timeout: 8000 });
        statusCode = resp.status;
        success = resp.status >= 200 && resp.status < 300;
        summary = `Dispatched candidate ${analysis.candidateName} assessment notification to ${settings.platform}`;
      } catch (err) {
        statusCode = err.response ? err.response.status : 500;
        summary = `Failed dispatching to ${settings.platform}: ${err.message}`;
      }
    } else {
      success = true;
      statusCode = 200;
      summary = `Simulated automated candidate notification dispatched for ${analysis.candidateName}`;
    }

    const logEntry = {
      timestamp: new Date(),
      event: eventType,
      status: success ? "success" : "failed",
      statusCode,
      summary,
    };

    await WebhookSetting.findOneAndUpdate(
      { userId: "recruiter" },
      {
        $set: { lastDispatchedAt: new Date(), lastStatus: success ? "active" : "error" },
        $inc: { dispatchCount: 1 },
        $push: { logs: logEntry },
      }
    );

    return { success, logEntry };
  } catch (e) {
    console.error("Webhook dispatch error:", e);
    return null;
  }
};

module.exports = {
  getSettings,
  updateSettings,
  testWebhook,
  dispatchCandidateWebhook,
};
