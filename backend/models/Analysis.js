const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// ─── Sub-schemas ──────────────────────────────────────────────────────────────
const WeaknessSchema = new mongoose.Schema({
  issue: String,
  impact: { type: String, enum: ["high", "medium", "low"] },
});

const ScoresSchema = new mongoose.Schema({
  clarity: Number,
  depth: Number,
  relevance: Number,
});

const StarSchema = new mongoose.Schema({
  situation: Boolean,
  task: Boolean,
  action: Boolean,
  result: Boolean,
});

const ProctoringViolationSchema = new mongoose.Schema({
  timestamp: String,
  timeInSeconds: Number,
  type: String,
  description: String,
  severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
});

const ProctoringSchema = new mongoose.Schema({
  integrityScore: { type: Number, default: 100 },
  riskLevel: { type: String, enum: ["low", "medium", "high"], default: "low" },
  tabSwitches: { type: Number, default: 0 },
  multipleFacesDetected: { type: Boolean, default: false },
  eyeContactPercent: { type: Number, default: 90 },
  violations: [ProctoringViolationSchema],
});

const RubricSchema = new mongoose.Schema({
  technicalAccuracy: { type: Number, default: 7 },
  starCompliance: { type: Number, default: 7 },
  communicationClarity: { type: Number, default: 7 },
  problemSolving: { type: Number, default: 7 },
  confidenceBodyLanguage: { type: Number, default: 8 },
});

// ─── Main analysis schema ─────────────────────────────────────────────────────
const AnalysisSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true }, // Clerk userId
    transcript: { type: String, required: true },
    scores: ScoresSchema,
    weaknesses: [WeaknessSchema],
    star: StarSchema,
    improved_answer: String,
    follow_up_question: String,
    hiring_score: Number,
    filler_words: { type: Map, of: Number }, // e.g. { "um": 3, "like": 5 }
    wpm: Number,
    filename: String,
    mediaType: { type: String, enum: ["audio", "video"], default: "audio" },
    mediaUrl: String,
    candidateName: { type: String, default: "Candidate" },
    candidateEmail: { type: String, default: "candidate@example.com" },
    targetRole: { type: String, default: "Full Stack Engineer" },
    question: String,
    status: {
      type: String,
      enum: ["Screening", "Shortlisted", "Under Review", "Rejected", "Offer Extended"],
      default: "Screening",
    },
    recruiterNotes: { type: String, default: "" },
    rubric: RubricSchema,
    proctoring: ProctoringSchema,
    recommendation: {
      type: String,
      enum: ["Strong Hire", "Hire", "Borderline", "Do Not Hire"],
      default: "Hire",
    },
    recruiterSummary: String,
    invitationToken: String,
    isPrivate: { type: Boolean, default: false },
    saveVideoFile: { type: Boolean, default: true },
    codeEvaluation: {
      problemTitle: String,
      language: String,
      code: String,
      passedCount: Number,
      totalCount: Number,
      executionTimeMs: Number,
      status: { type: String, default: "PASSED" },
      feedback: String,
      complexity: String,
    },
    conversationHistory: [
      {
        role: { type: String, enum: ["ai", "candidate"] },
        text: String,
        timestamp: String,
        stage: String,
      },
    ],
    webhookDispatched: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const MongooseAnalysis = mongoose.model("Analysis", AnalysisSchema);

// ─── In-Memory / File-backed Fallback Store (for demo / offline dev) ─────────
const storageFile = path.join(__dirname, "../data/analyses.json");

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

let localStore = loadLocalData();

const generateId = () => {
  return (
    Math.floor(Date.now() / 1000).toString(16) +
    "xxxxxxxxxxxxxxxx"
      .replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16))
      .toLowerCase()
  );
};

const LocalAnalysis = {
  async create(doc) {
    const store = loadLocalData();
    const newDoc = {
      _id: generateId(),
      status: "Screening",
      recruiterNotes: "",
      isPrivate: false,
      saveVideoFile: true,
      proctoring: {
        integrityScore: 100,
        riskLevel: "low",
        tabSwitches: 0,
        multipleFacesDetected: false,
        eyeContactPercent: 92,
        violations: [],
      },
      rubric: {
        technicalAccuracy: 7.5,
        starCompliance: 7.0,
        communicationClarity: 8.0,
        problemSolving: 7.5,
        confidenceBodyLanguage: 8.0,
      },
      recommendation: "Hire",
      ...doc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.unshift(newDoc);
    saveLocalData(store);
    return newDoc;
  },

  find(query = {}) {
    const store = loadLocalData();
    let result = store.filter((item) => {
      for (const [key, val] of Object.entries(query)) {
        if (val && typeof val === "object" && "$regex" in val) {
          const regex = new RegExp(val.$regex, val.$options || "");
          if (!regex.test(String(item[key] || ""))) return false;
        } else if (val && typeof val === "object" && "$ne" in val) {
          if (item[key] === val.$ne) return false;
        } else if (item[key] !== val && String(item[key]) !== String(val)) {
          return false;
        }
      }
      return true;
    });

    const chain = {
      _data: [...result],
      sort(sortObj) {
        if (sortObj) {
          if (sortObj.createdAt === -1) {
            this._data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          } else if (sortObj.hiring_score === -1) {
            this._data.sort((a, b) => (b.hiring_score || 0) - (a.hiring_score || 0));
          } else if (sortObj["proctoring.integrityScore"] === -1) {
            this._data.sort(
              (a, b) =>
                (b.proctoring?.integrityScore || 100) -
                (a.proctoring?.integrityScore || 100)
            );
          }
        }
        return this;
      },
      select(fields) {
        if (typeof fields === "string" && fields.includes("-transcript")) {
          this._data = this._data.map(({ transcript, ...rest }) => rest);
        }
        return this;
      },
      lean() {
        return Promise.resolve(this._data);
      },
      then(resolve, reject) {
        return Promise.resolve(this._data).then(resolve, reject);
      },
    };
    return chain;
  },

  findOne(query = {}) {
    const store = loadLocalData();
    const found = store.find((item) => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val && String(item[key]) !== String(val)) return false;
      }
      return true;
    });

    const chain = {
      _data: found ? { ...found } : null,
      lean() {
        return Promise.resolve(this._data);
      },
      then(resolve, reject) {
        return Promise.resolve(this._data).then(resolve, reject);
      },
    };
    return chain;
  },

  findById(id) {
    return this.findOne({ _id: id });
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const store = loadLocalData();
    const index = store.findIndex(
      (item) => String(item._id) === String(id)
    );
    if (index === -1) return null;

    const current = store[index];
    let updated;
    if (update.$set) {
      updated = { ...current, ...update.$set, updatedAt: new Date().toISOString() };
    } else {
      updated = { ...current, ...update, updatedAt: new Date().toISOString() };
    }
    store[index] = updated;
    saveLocalData(store);
    return updated;
  },

  async findByIdAndDelete(id) {
    const store = loadLocalData();
    const index = store.findIndex(
      (item) => String(item._id) === String(id)
    );
    if (index === -1) return null;
    const deleted = store.splice(index, 1)[0];
    saveLocalData(store);
    return deleted;
  },
};

// Export proxy that seamlessly uses Mongoose when connected or Local Store when disconnected
module.exports = new Proxy(MongooseAnalysis, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in LocalAnalysis) {
      return LocalAnalysis[prop];
    }
    return target[prop];
  },
});
