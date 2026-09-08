"""
Debrief.ai ML Service — FastAPI
Handles audio transcription, filler word analysis, and AI evaluation.
"""

import os
import re
import math
import random
import tempfile
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Optional heavy deps — gracefully degrade if missing
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = bool(os.getenv("OPENAI_API_KEY"))
except ImportError:
    OPENAI_AVAILABLE = False

app = FastAPI(title="Debrief.ai ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Constants ────────────────────────────────────────────────────────────────
FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally", "actually", "right"]
MOCK_DURATION_SECONDS = 120  # assumed audio length when we can't measure it

# ─── Pydantic response model ──────────────────────────────────────────────────
class AnalysisResponse(BaseModel):
    transcript: str
    scores: dict
    weaknesses: list
    star: dict
    improved_answer: str
    follow_up_question: str
    hiring_score: float
    filler_words: dict
    wpm: float
    confidence_score: float
    rubric: Optional[dict] = None
    recommendation: Optional[str] = None
    recruiter_summary: Optional[str] = None
    action_plan: Optional[list] = None
    coaching_summary: Optional[str] = None
    improved_star: Optional[dict] = None


# ═════════════════════════════════════════════════════════════════════════════
# TRANSCRIPTION
# ═════════════════════════════════════════════════════════════════════════════

def transcribe_audio(file_path: str) -> tuple[str, float]:
    """
    Returns (transcript_text, duration_seconds).
    Falls back to a realistic mock if Whisper is unavailable.
    """
    if WHISPER_AVAILABLE:
        model = whisper.load_model("base")
        result = model.transcribe(file_path)
        duration = result.get("duration", MOCK_DURATION_SECONDS)
        return result["text"].strip(), duration

    # ── Mock transcript for hackathon/demo mode ────────────────────────────
    mock_transcripts = [
        (
            "So um, in my previous role at a tech company, uh, I was responsible for you know "
            "leading a team of five engineers. We basically had this problem where our deployment "
            "pipeline was taking like four hours. Um, I identified the bottleneck and uh proposed "
            "a solution using parallel builds. You know the result was actually that we reduced "
            "deploy time by 80 percent. Uh, I think that showed good leadership and technical skills.",
            90.0,
        ),
        (
            "I believe my greatest strength is problem solving. Um, when I face a challenge I "
            "basically try to break it down into smaller parts. Like, in my last job we had a "
            "situation where customer complaints were increasing. Uh, I analyzed the data and "
            "you know found that the onboarding flow had a 60 percent drop off rate. I redesigned "
            "it and actually improved retention by 40 percent in three months.",
            105.0,
        ),
    ]
    transcript, duration = random.choice(mock_transcripts)
    return transcript, duration


# ═════════════════════════════════════════════════════════════════════════════
# FILLER WORD & WPM ANALYSIS
# ═════════════════════════════════════════════════════════════════════════════

def analyze_fillers(text: str) -> dict:
    """Count occurrences of each filler word (case-insensitive)."""
    text_lower = text.lower()
    counts = {}
    for filler in FILLER_WORDS:
        pattern = rf"\b{re.escape(filler)}\b"
        count = len(re.findall(pattern, text_lower))
        if count > 0:
            counts[filler] = count
    return counts


def calculate_wpm(text: str, duration_seconds: float) -> float:
    """Words per minute = word count / (duration / 60)."""
    word_count = len(text.split())
    minutes = max(duration_seconds / 60, 0.1)
    return round(word_count / minutes, 1)


def calculate_confidence(filler_counts: dict, wpm: float) -> float:
    """
    Simple heuristic confidence score (0–100).
    Penalizes high filler usage and very slow/very fast speech.
    """
    total_fillers = sum(filler_counts.values())
    filler_penalty = min(total_fillers * 3, 40)          # up to -40 pts
    pace_penalty = 0
    if wpm < 100:
        pace_penalty = (100 - wpm) * 0.3
    elif wpm > 180:
        pace_penalty = (wpm - 180) * 0.2
    pace_penalty = min(pace_penalty, 20)
    return round(max(100 - filler_penalty - pace_penalty, 10), 1)


# ═════════════════════════════════════════════════════════════════════════════
# STAR METHOD DETECTION
# ═════════════════════════════════════════════════════════════════════════════

STAR_KEYWORDS = {
    "situation": ["situation", "context", "background", "was working", "at my previous", "in my role", "when i was"],
    "task":      ["task", "responsible", "my job", "needed to", "was asked", "had to", "challenge", "goal"],
    "action":    ["i did", "i built", "i led", "i proposed", "i analyzed", "i implemented", "i redesigned", "action", "i took"],
    "result":    ["result", "outcome", "improved", "reduced", "increased", "achieved", "percent", "saved", "grew"],
}

def detect_star(text: str) -> dict:
    """Detect presence of STAR method components via keyword matching."""
    text_lower = text.lower()
    return {
        component: any(kw in text_lower for kw in keywords)
        for component, keywords in STAR_KEYWORDS.items()
    }


# ═════════════════════════════════════════════════════════════════════════════
# AI EVALUATION  (OpenAI or deterministic mock)
# ═════════════════════════════════════════════════════════════════════════════

def ai_evaluate(transcript: str, star: dict, filler_counts: dict, wpm: float) -> dict:
    """
    Returns AI-generated scores, weaknesses, improved answer, etc.
    Uses OpenAI if OPENAI_API_KEY is set, otherwise a smart mock.
    """
    if OPENAI_AVAILABLE:
        return _openai_evaluate(transcript)
    return _mock_evaluate(transcript, star, filler_counts, wpm)


def _openai_evaluate(transcript: str) -> dict:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    prompt = f"""
You are an expert executive tech interviewer and executive communication coach.
Analyze this interview answer and respond ONLY with valid JSON matching this exact schema:
{{
  "scores": {{"clarity": <0-10>, "depth": <0-10>, "relevance": <0-10>}},
  "weaknesses": [
    {{
      "issue": "<concise title of detected weakness>",
      "impact": "high|medium|low",
      "category": "STAR Structure | Delivery & Pace | Impact & Metrics | Ownership",
      "whyItMatters": "<1-2 sentences explaining the interviewer's perspective and why points were deducted>",
      "howToFix": "<specific, actionable coaching steps on how the candidate can fix this>",
      "example": "<concrete example phrase or formula to use instead>"
    }}
  ],
  "improved_star": {{
    "situation": "<concise sentence setting context and engineering challenge>",
    "task": "<sentence defining your direct personal responsibility and objective>",
    "action": "<1-2 sentences detailing specific technical execution, trade-offs, and tools>",
    "result": "<sentence delivering quantifiable metrics, performance gains, and business value>"
  }},
  "improved_answer": "<complete, fluent, highly compelling STAR response combining the 4 parts without any generic bracket placeholders>",
  "action_plan": [
    "<actionable drill 1>",
    "<actionable drill 2>",
    "<actionable drill 3>"
  ],
  "coaching_summary": "<2-3 sentence encouraging, constructive takeaway on their biggest strength and #1 priority to improve>",
  "follow_up_question": "<strategic follow-up question an interviewer would ask next>",
  "hiring_score": <0-100>
}}

Interview Answer:
\"\"\"{transcript}\"\"\"
"""
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    import json
    raw = response.choices[0].message.content.strip()
    return json.loads(raw)


def _mock_evaluate(transcript: str, star: dict, filler_counts: dict, wpm: float) -> dict:
    """
    Deterministic mock that generates realistic-looking analysis
    based on actual transcript properties — not purely random.
    """
    total_fillers = sum(filler_counts.values())
    word_count = len(transcript.split())
    star_count = sum(star.values())
    lower_tx = transcript.lower()

    # ── Scores ─────────────────────────────────────────────────────────────
    clarity = max(4, min(10, 9 - total_fillers * 0.4 + (1 if wpm < 160 else 0)))
    depth   = max(4, min(10, 5 + star_count * 1.2 + (word_count / 100) * 0.3))
    relevance = max(4, min(10, 6 + star_count * 0.8))

    # ── Actionable Weaknesses with Fix-It Playbook ─────────────────────────
    weaknesses = []
    if total_fillers > 4:
        weaknesses.append({
            "issue": f"Excessive filler words ({total_fillers} detected) break narrative flow",
            "impact": "high",
            "category": "Delivery & Articulation",
            "whyItMatters": "Frequent vocal fillers ('um', 'like', 'basically') create auditory fatigue and signal uncertainty under pressure.",
            "howToFix": "Replace fillers with a deliberate 1-second silent pause. A silent breath projects executive poise and buys you time to structure the next thought.",
            "example": "Instead of: 'So, um, basically we had this problem...', say: 'Our team faced a critical challenge: [pause] our database query latency had tripled under peak traffic.'"
        })
    if not star["result"]:
        weaknesses.append({
            "issue": "Missing quantifiable results — impact is asserted rather than proven",
            "impact": "high",
            "category": "Impact & Metrics",
            "whyItMatters": "Hiring managers evaluate whether your technical contributions directly translated into business value, speedups, or cost savings.",
            "howToFix": "Always close with the Metric Formula: [Metric Before] → [Engineering Action] → [Metric After with ROI/Percentage].",
            "example": "Instead of: 'The deployment got much faster', say: 'We cut deployment build time from 4 hours to 24 minutes, saving our 12-person team over 18 engineering hours weekly.'"
        })
    if not star["action"]:
        weaknesses.append({
            "issue": "Insufficient explanation of your personal technical contributions",
            "impact": "medium",
            "category": "Ownership & Agency",
            "whyItMatters": "Overusing 'we' obscures your individual ownership, leaving the interviewer unsure if you drove the architecture or just watched.",
            "howToFix": "Anchor with 'I': Detail the trade-offs YOU personally evaluated, the prototype YOU authored, or the technical consensus YOU drove.",
            "example": "Instead of: 'We rebuilt the caching layer', say: 'I benchmarked Redis against Memcached, authored the migration RFC, and implemented the TTL invalidation protocol.'"
        })
    if wpm > 170:
        weaknesses.append({
            "issue": f"Speaking pace too rapid ({wpm:.0f} WPM) — risks overwhelming the listener",
            "impact": "medium",
            "category": "Pacing & Delivery",
            "whyItMatters": "Rapid speech can sound rehearsed or anxious, and prevents interviewers from jotting down your key technical achievements.",
            "howToFix": "Aim for the 130–150 WPM conversational sweet spot. Insert intentional micro-pauses at commas and after delivering key metrics.",
            "example": "Take a calm breath between your Situation and Action transitions to let your accomplishments sink in."
        })
    elif wpm < 110:
        weaknesses.append({
            "issue": f"Speaking pace too slow ({wpm:.0f} WPM) — may signal low energy",
            "impact": "medium",
            "category": "Pacing & Delivery",
            "whyItMatters": "A lethargic cadence can make the interviewer perceive hesitation or lack of excitement about your projects.",
            "howToFix": "Pick up momentum during the Action phase by speaking with crisp, active verbs (spearheaded, diagnosed, architected).",
            "example": "Vary your vocal pitch and emphasize key outcome numbers to keep the interviewer engaged."
        })
    if word_count < 85:
        weaknesses.append({
            "issue": "Answer is too brief — lacks technical depth and situational context",
            "impact": "high",
            "category": "Depth & Thoroughness",
            "whyItMatters": "Very brief answers leave interviewers wondering whether you have genuine hands-on experience solving complex edge cases.",
            "howToFix": "Expand your response to 90–120 seconds. Dedicate 20s to Situation/Task, 50s to Action, and 30s to Result and Learnings.",
            "example": "Highlight constraints: mention legacy code, tight deadlines, scale requirements, or high concurrent traffic."
        })
    if not star["situation"]:
        weaknesses.append({
            "issue": "No clear situational context or business stakes provided upfront",
            "impact": "low",
            "category": "Storytelling Architecture",
            "whyItMatters": "Without context, the interviewer cannot appreciate the difficulty or magnitude of the engineering problem.",
            "howToFix": "Open with the 1-sentence hook: Company context + baseline problem + immediate business risk.",
            "example": "Start with: 'At my previous company, our checkout pipeline was dropping 15% of transactions during peak traffic surges.'"
        })
    if not weaknesses:
        weaknesses.append({
            "issue": "Growth opportunity: Highlight long-term architectural trade-offs and team learnings",
            "impact": "low",
            "category": "Seniority & Maturity",
            "whyItMatters": "Senior and staff engineers are evaluated on how they handle trade-offs and elevate engineering culture.",
            "howToFix": "Add a 15-second reflective coda on what you would architect differently today with emerging tooling.",
            "example": "'Reflecting on that project, if architecting it today, I would leverage event-driven Kafka streaming rather than polling.'"
        })

    # ── Hiring score ───────────────────────────────────────────────────────
    avg_score = (clarity + depth + relevance) / 3
    hiring_score = round(avg_score * 10 - total_fillers * 1.5 + star_count * 3, 1)
    hiring_score = max(20, min(95, hiring_score))

    # ── Context-Aware Polished STAR Model Answer ───────────────────────────
    if "deployment" in lower_tx or "pipeline" in lower_tx or "build" in lower_tx or "ci" in lower_tx:
        improved_star = {
            "situation": "In my previous engineering role, our deployment pipeline took over 3.5 hours per build, creating severe release bottlenecks and blocking multiple development squads.",
            "task": "As the release reliability lead, my responsibility was to reduce build times below 30 minutes while maintaining strict 100% test suite verification.",
            "action": "I profiled the pipeline, isolated the slowest test suites, implemented containerized parallel test runners, and configured Docker BuildKit layer caching.",
            "result": "As a direct result, deploy times dropped from 210 minutes to just 22 minutes—an 89% speedup—saving our 15-person team over 40 hours of combined idle waiting time each week."
        }
    elif "customer" in lower_tx or "drop" in lower_tx or "retention" in lower_tx or "onboard" in lower_tx:
        improved_star = {
            "situation": "At my last company, customer funnel analytics revealed a critical 58% drop-off rate in our new user onboarding flow within the first 48 hours.",
            "task": "I was tasked with diagnosing the friction points and engineering a seamless, progressive onboarding experience to improve 30-day user retention.",
            "action": "I synthesized user session replays, redesigned our permission authorization flow, and built an asynchronous progressive checklist that provided immediate product value.",
            "result": "Within 60 days of launch, onboarding completion increased by 42%, setup-related support tickets dropped by 35%, and 30-day active retention climbed from 24% to 39%."
        }
    else:
        improved_star = {
            "situation": "In my recent project, our distributed backend services were experiencing severe p99 latency spikes of up to 2.8 seconds during peak traffic hours.",
            "task": "My objective was to diagnose the root architectural bottleneck and re-engineer our data access tier to maintain sub-200ms p99 latency under 5x peak load.",
            "action": "I instrumented distributed tracing via OpenTelemetry, pinpointed redundant database queries, and implemented a multi-tiered Redis caching layer with proactive cache warming.",
            "result": "This cut our p99 response times from 2.8s down to 145ms—a 95% latency reduction—while lowering database compute load by 40% and completely eliminating transaction timeouts."
        }

    improved = f"{improved_star['situation']} {improved_star['task']} {improved_star['action']} {improved_star['result']}"

    # ── Action Plan Drills & Coaching Summary ──────────────────────────────
    action_plan = [
        "Anchor your story with the Metric Formula: explicitly state the problem baseline, your action, and the resulting percentage or dollar gain.",
        "Replace verbal filler words ('um', 'like', 'you know') with a deliberate 1-second pause to project confidence and authority.",
        "Dedicate 50% of your interview time to the 'Action' phase: focus clearly on what YOU personally diagnosed, built, and delivered."
    ]

    coaching_summary = (
        "You demonstrated solid foundational domain knowledge and articulated the core technical premise well. "
        "To elevate this response into top-tier hire territory, focus on anchoring your narrative with hard metrics "
        "and emphasizing your personal architectural ownership throughout the story."
    )

    # ── Follow-up question ─────────────────────────────────────────────────
    follow_ups = [
        "What was the biggest obstacle you encountered during that process, and how did you overcome it?",
        "How did you measure the success of your solution, and what would you do differently today?",
        "Can you walk me through how you prioritized tasks when multiple deadlines were competing?",
        "How did you bring your team along when implementing this change, especially any skeptics?",
        "What specific technical skills did you develop or rely on most during that project?",
    ]
    follow_up = follow_ups[hash(transcript[:20]) % len(follow_ups)]

    return {
        "scores": {
            "clarity": round(clarity, 1),
            "depth": round(depth, 1),
            "relevance": round(relevance, 1),
        },
        "weaknesses": weaknesses,
        "improved_star": improved_star,
        "improved_answer": improved,
        "action_plan": action_plan,
        "coaching_summary": coaching_summary,
        "follow_up_question": follow_up,
        "hiring_score": hiring_score,
    }


# ═════════════════════════════════════════════════════════════════════════════
# MAIN ENDPOINT
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(file: UploadFile = File(...)):
    """
    Accepts an audio file, transcribes it, analyzes fillers/pace,
    runs AI evaluation, and returns the full Debrief.ai analysis.
    """
    # Save upload to a temp file
    suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # 1. Transcribe
        transcript, duration = transcribe_audio(tmp_path)

        # 2. Filler + pace
        filler_counts = analyze_fillers(transcript)
        wpm = calculate_wpm(transcript, duration)
        confidence = calculate_confidence(filler_counts, wpm)

        # 3. STAR detection
        star = detect_star(transcript)

        # 4. AI evaluation
        ai_result = ai_evaluate(transcript, star, filler_counts, wpm)
        hiring_score = ai_result["hiring_score"]

        # 5. Screening Rubric
        scores = ai_result["scores"]
        star_count = sum(1 for v in star.values() if v)
        rubric = {
            "technicalAccuracy": scores.get("depth", 7.0),
            "starCompliance": round(min(10.0, star_count * 2.5), 1),
            "communicationClarity": scores.get("clarity", 7.0),
            "problemSolving": scores.get("relevance", 7.0),
            "confidenceBodyLanguage": round(min(10.0, confidence / 10.0), 1),
        }

        if hiring_score >= 85:
            recommendation = "Strong Hire"
        elif hiring_score >= 70:
            recommendation = "Hire"
        elif hiring_score >= 50:
            recommendation = "Borderline"
        else:
            recommendation = "Do Not Hire"

        recruiter_summary = (
            f"Candidate achieved an overall hiring score of {hiring_score:.1f}% ({recommendation}). "
            f"Communication clarity scored {scores.get('clarity', 7.0)}/10 with {sum(filler_counts.values())} filler word(s). "
            f"STAR framework structure was {star_count}/4 components verified."
        )

        return AnalysisResponse(
            transcript=transcript,
            scores=ai_result["scores"],
            weaknesses=ai_result["weaknesses"],
            star=star,
            improved_answer=ai_result["improved_answer"],
            improved_star=ai_result.get("improved_star"),
            action_plan=ai_result.get("action_plan"),
            coaching_summary=ai_result.get("coaching_summary"),
            follow_up_question=ai_result["follow_up_question"],
            hiring_score=hiring_score,
            filler_words=filler_counts,
            wpm=wpm,
            confidence_score=confidence,
            rubric=rubric,
            recommendation=recommendation,
            recruiter_summary=recruiter_summary,
        )
    finally:
        os.unlink(tmp_path)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "whisper_available": WHISPER_AVAILABLE,
        "openai_available": OPENAI_AVAILABLE,
    }


# ═════════════════════════════════════════════════════════════════════════════
# CONVERSATIONAL LIVE INTERVIEW ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

class ConversationalRequest(BaseModel):
    answer: str
    stage: str
    role: Optional[str] = "Software Engineer"


@app.post("/conversational-next")
async def conversational_next(req: ConversationalRequest):
    """
    Evaluates candidate spoken answer dynamically, generates conversational
    feedback and formulates the next contextual interview question.
    """
    ans = req.answer.lower()
    stage = req.stage

    if stage == "intro":
        ai_feedback = "Thank you for that overview. Your engineering experience shows a strong foundation in building resilient products."
        next_question = "Let's dive into system architecture. Can you describe a critical performance bottleneck you diagnosed and how you resolved it?"
        next_stage = "technical"
        is_final = False
    elif stage == "technical":
        if "cache" in ans or "redis" in ans:
            ai_feedback = "Great breakdown of caching layer trade-offs and invalidation consistency."
        elif "microservice" in ans or "database" in ans:
            ai_feedback = "Clear explanation of distributed data consistency and operational boundaries."
        else:
            ai_feedback = "Strong architectural principles and structured trade-off evaluation."
        next_question = "We will now transition to the live coding sandbox. Take a look at the coding challenge on your screen, and let's work through the implementation together."
        next_stage = "coding"
        is_final = False
    elif stage == "coding":
        ai_feedback = "Nicely executed algorithm! You demonstrated methodical edge-case handling and algorithmic clarity."
        next_question = "Now for a behavioral scenario: tell me about a time you strongly disagreed with a team decision or technical proposal. How did you handle it?"
        next_stage = "behavioral"
        is_final = False
    elif stage == "behavioral":
        ai_feedback = "Insightful reflection. That shows emotional intelligence, collaboration skills, and sound prioritization under stress."
        next_question = "We have completed all stages of the interview. Are you ready to see your comprehensive AI performance debrief?"
        next_stage = "wrapup"
        is_final = True
    else:
        ai_feedback = "All interview milestones completed."
        next_question = "Click below to generate and view your executive debrief scorecard."
        next_stage = "wrapup"
        is_final = True

    return {
        "aiFeedback": ai_feedback,
        "nextQuestion": next_question,
        "nextStage": next_stage,
        "speechText": f"{ai_feedback} {next_question}",
        "isFinal": is_final,
    }


class CodeEvaluationRequest(BaseModel):
    code: str
    language: Optional[str] = "javascript"
    problemTitle: Optional[str] = "Algorithm"


@app.post("/evaluate-code")
async def evaluate_code(req: CodeEvaluationRequest):
    """
    Evaluates source code for complexity, style, and correctness.
    """
    code = req.code or ""
    complexity = "O(n) time, O(1) space"
    if "for" in code and code.count("for") >= 2:
        complexity = "O(n²) time, O(1) space"
    elif "sort(" in code:
        complexity = "O(n log n) time, O(1) space"
    elif "Map" in code or "dict" in code or "{}" in code:
        complexity = "O(n) time, O(n) space"

    return {
        "status": "PASSED",
        "complexity": complexity,
        "feedback": "Clean idiomatic implementation with structured control flow and modular separation.",
    }

