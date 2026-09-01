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
    candidateName: String,
    targetRole: String,
    question: String,
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
    const newDoc = {
      _id: generateId(),
      ...doc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStore.unshift(newDoc);
    saveLocalData(localStore);
    return newDoc;
  },

  find(query = {}) {
    let result = localStore.filter((item) => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val) return false;
      }
      return true;
    });

    const chain = {
      _data: [...result],
      sort(sortObj) {
        if (sortObj && sortObj.createdAt === -1) {
          this._data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    const found = localStore.find((item) => {
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
