const mongoose = require("mongoose");

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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analysis", AnalysisSchema);
