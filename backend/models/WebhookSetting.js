const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const WebhookSettingSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "recruiter" },
    platform: { type: String, enum: ["slack", "discord", "custom", "email"], default: "slack" },
    webhookUrl: { type: String, default: "" },
    emailAlertsTo: { type: String, default: "" },
    events: {
      onAssessmentCompleted: { type: Boolean, default: true },
      onCheatingFlagged: { type: Boolean, default: true },
      onCandidateShortlisted: { type: Boolean, default: true },
    },
    enabled: { type: Boolean, default: true },
    lastDispatchedAt: { type: Date },
    dispatchCount: { type: Number, default: 0 },
    lastStatus: { type: String, default: "idle" },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        event: String,
        status: String,
        statusCode: Number,
        summary: String,
      },
    ],
  },
  { timestamps: true }
);

const MongooseWebhookSetting = mongoose.model("WebhookSetting", WebhookSettingSchema);

// ─── Local JSON Store Fallback ────────────────────────────────────────────────
const storageFile = path.join(__dirname, "../data/webhook_settings.json");

const loadLocalData = () => {
  try {
    if (fs.existsSync(storageFile)) {
      return JSON.parse(fs.readFileSync(storageFile, "utf-8"));
    }
  } catch (e) {
    // ignore
  }
  return [];
};

const saveLocalData = (data) => {
  try {
    const dir = path.dirname(storageFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2));
  } catch (e) {
    // ignore
  }
};

const LocalWebhookSetting = {
  async findOne(query = {}) {
    const store = loadLocalData();
    let found = store.find((item) => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val && String(item[key]) !== String(val)) return false;
      }
      return true;
    });

    if (!found) {
      found = {
        _id: "webhook_default_1",
        userId: query.userId || "recruiter",
        platform: "slack",
        webhookUrl: "",
        emailAlertsTo: "hiring-team@debrief.ai",
        events: {
          onAssessmentCompleted: true,
          onCheatingFlagged: true,
          onCandidateShortlisted: true,
        },
        enabled: true,
        lastDispatchedAt: null,
        dispatchCount: 0,
        lastStatus: "ready",
        logs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.push(found);
      saveLocalData(store);
    }

    const chain = {
      _data: { ...found },
      lean() {
        return Promise.resolve(this._data);
      },
      then(resolve, reject) {
        return Promise.resolve(this._data).then(resolve, reject);
      },
    };
    return chain;
  },

  async findOneAndUpdate(query, update, options = {}) {
    const store = loadLocalData();
    let index = store.findIndex((item) => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val && String(item[key]) !== String(val)) return false;
      }
      return true;
    });

    let current = index !== -1 ? store[index] : null;
    if (!current) {
      current = {
        _id: "webhook_default_1",
        userId: query.userId || "recruiter",
        platform: "slack",
        webhookUrl: "",
        emailAlertsTo: "hiring-team@debrief.ai",
        events: {
          onAssessmentCompleted: true,
          onCheatingFlagged: true,
          onCandidateShortlisted: true,
        },
        enabled: true,
        lastDispatchedAt: null,
        dispatchCount: 0,
        lastStatus: "ready",
        logs: [],
        createdAt: new Date().toISOString(),
      };
      store.push(current);
      index = store.length - 1;
    }

    let updated;
    if (update.$set) {
      updated = { ...current, ...update.$set, updatedAt: new Date().toISOString() };
    } else {
      updated = { ...current, ...update, updatedAt: new Date().toISOString() };
    }

    if (update.$push && update.$push.logs) {
      updated.logs = [update.$push.logs, ...(updated.logs || [])].slice(0, 30);
    }

    store[index] = updated;
    saveLocalData(store);
    return updated;
  },
};

module.exports = new Proxy(MongooseWebhookSetting, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in LocalWebhookSetting) {
      return LocalWebhookSetting[prop];
    }
    return target[prop];
  },
});
