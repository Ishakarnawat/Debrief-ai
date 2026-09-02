const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const InvitationSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true },
    companyName: { type: String, default: "Debrief.ai Partner" },
    questions: [{ type: String }],
    candidateEmail: { type: String },
    proctoringEnabled: { type: Boolean, default: true },
    strictMode: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "completed", "expired"], default: "active" },
    createdBy: { type: String, default: "recruiter" },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

const MongooseInvitation = mongoose.model("Invitation", InvitationSchema);

// ─── Local JSON Store Fallback ────────────────────────────────────────────────
const storageFile = path.join(__dirname, "../data/invitations.json");

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

const generateToken = () => {
  return "inv_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

const LocalInvitation = {
  async create(doc) {
    const newDoc = {
      _id: "inv_id_" + Math.random().toString(36).substring(2, 9),
      token: doc.token || generateToken(),
      companyName: "Debrief.ai Partner",
      proctoringEnabled: true,
      strictMode: false,
      status: "active",
      questions: ["Tell me about a time you solved a major technical bottleneck."],
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
        if (item[key] !== val && String(item[key]) !== String(val)) return false;
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

module.exports = new Proxy(MongooseInvitation, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in LocalInvitation) {
      return LocalInvitation[prop];
    }
    return target[prop];
  },
});
