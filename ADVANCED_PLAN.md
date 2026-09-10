# 🎙️ Debrief.ai (Pro) — Advanced AI Interview & Candidate Screening Platform

Debrief.ai is transitioning from a simple audio-analysis tool into a **comprehensive, enterprise-grade video interview and candidate screening platform**. This project leverages modern web technologies and AI models to provide real-time behavioral analysis, cheating detection, and automated candidate evaluations for recruiters, while offering a mock-interview coaching mode for students.

---

## 🚀 The Advanced Vision (Final Year Project Ready)

To make this a standout final-year project, the platform will cater to two main user bases:
1. **Candidates (B2C):** Practice interviews with AI avatars/voicebots, record video, and get real-time feedback on body language, eye contact, and vocal tone.
2. **Recruiters (B2B):** Send asynchronous interview links to candidates. The system records them, screens the videos, analyzes technical/soft skills, flags potential cheating, and ranks candidates on a dashboard.

---

## 🌟 Proposed Advanced Features

### 1. 📹 Video & Camera Integration (The Core Upgrade)
- **Live Video Recording:** Integrate WebRTC and `MediaRecorder` API to allow users to record video interviews directly in the browser.
- **Eye-Tracking & Attention Detection:** Use computer vision (e.g., MediaPipe or OpenCV via WebAssembly/FastAPI) to track if the candidate is constantly looking away (reading from a script).
- **Emotion & Facial Expression Analysis:** Analyze the candidate's confidence levels (nervous, confident, neutral) during different questions.

### 2. 🛡️ Candidate Screening & Proctoring (For Recruiters) ✅ [IMPLEMENTED]
- **Anti-Cheat System:** Detect multiple faces in the frame, background voices, or tab-switching (browser visibility API) with real-time HUD alerts and chronological timeline logging.
- **Automated Scoring:** The AI evaluates answers against a 5-dimension rubric (technical accuracy, STAR method, clarity, problem solving, confidence) and assigns a score out of 100 with hiring recommendations.
- **Recruiter Dashboard:** Both an interactive Ranking Table and a drag-and-drop Kanban pipeline board with anti-cheat risk badges and deep-dive proctoring review modal.
- **Interview Invitation Generator:** Unique link generator (`/interview/:token`) for recruiters to invite candidates with custom prompts and strict proctoring mode.

### 3. 🤖 Real-Time Interactive AI Interviewer ✅ [IMPLEMENTED]
- Live conversational AI interview room (`/live-interview`) with voice/TTS synthesis, animated speech waveforms, and dynamic follow-up questioning based on candidate responses.

### 4. 💻 Live Coding Environment (Optional but Impressive) ✅ [IMPLEMENTED]
- Split screen: Live candidate video on one side, and an interactive code editor with algorithmic test execution suite (Two Sum, Palindrome, Rate Limiter) and complexity evaluation on the other.

---

## 🎨 UI/UX Revamp Ideas

To make it look like a premium, modern SaaS product:
- **Dark Mode by Default:** Sleek, professional dark UI with neon accents (Tailwind CSS).
- **Dashboard Analytics:** Recharts 5-Dimension Competency Radar charts comparing candidate scores against industry standards.
- **Interview Room Interface:** Real-time AI Room with floating AI avatar widget, speech transcription, and proctoring HUD indicators.
- **Post-Interview Report:** Highly visual, one-click printable & downloadable PDF scorecard summarizing all hiring criteria.

---

## 📅 Suggested Development Phases

### Phase 1: Video Capture & Storage (Weeks 1-2) ✅ [IMPLEMENTED]
- **Frontend:** Implement the camera UI using `react-webcam` or native WebRTC. Add permissions handling for mic/camera.
- **Backend/Cloud:** Stream or upload recorded video chunks to AWS S3 or Cloudinary.
- **Database:** Update MongoDB schema to support `VideoInterview` models, linking recruiters to candidates.

### Phase 2: Core Video AI Processing (Weeks 3-4) ✅ [IMPLEMENTED]
- **ML Service:** Integrate facial detection (MediaPipe) in the FastAPI backend to extract frames and analyze eye-tracking/emotions.
- **Audio Extraction:** Extract audio from the video file using FFmpeg, pass it to Whisper for transcription, and then to LLM for STAR method analysis.
- **Result Aggregation:** Combine video insights (confidence, eye contact) and audio insights (filler words, answer quality) into a single score.

### Phase 3: The Recruiter Workflow & Proctoring (Weeks 5-6) ✅ [IMPLEMENTED]
- **Role-based Auth:** Setup Clerk to separate `Recruiter` and `Candidate` roles.
- **Link Generation:** Recruiters can create unique interview links and send them to candidates.
- **Proctoring Features:** Implement browser tab-switching detection and multiple-face detection in the ML service.
- **Recruiter Dashboard:** Build the UI for recruiters to view a ranked list of candidates with their AI summary reports.

### Phase 4: Polish, UI Changes & Advanced Features (Weeks 7-8) ✅ [IMPLEMENTED]
- Implement interactive 5-dimension radar charts on candidate reviews and dashboards.
- Add conversational AI interviewer with animated avatar and TTS question voicing.
- Build split-screen algorithmic live coding sandbox with automated test case validation.
- Generate one-click downloadable and printable executive PDF scorecard reports.
- Automated Recruiter Webhooks (Slack, Discord, Custom JSON API) with delivery logs and test ping.

### Phase 5A: MediaPipe In-Browser Vision & Gaze Tracking ✅ [IMPLEMENTED]
- **478-Point Facial Mesh:** Real-time client-side `@mediapipe/tasks-vision` landmarker running on WebGL GPU with CPU fallback.
- **Iris Gaze Tracking:** Normalized pupil ratio calculation detecting directional deviation (center, left, right, up, down).
- **3D Head Pose Angles:** Mathematical projection of yaw, pitch, and roll to enforce interview attention compliance.
- **Script-Reading / Teleprompter Detection:** Saccadic horizontal scanning heuristic to catch applicants reading off second monitors or hidden prompt windows.
- **Live Cyberpunk HUD Overlay:** Transparent Canvas overlay rendering facial contours, iris reticles, and real-time security alerts on camera preview.
- **Recruiter & Scorecard Telemetry:** End-to-end telemetry pipeline from candidate browser to MongoDB, Candidate Review Modal, and printable PDF Scorecard.

### Phase 5B: Multi-Candidate Comparison Matrix & ATS Exporter ✅ [IMPLEMENTED]
- **Head-to-Head Comparison Matrix:** Side-by-side evaluation modal (`CandidateComparisonModal.jsx`) comparing 2 to 4 candidates simultaneously.
- **Multi-Candidate Overlaid Radar Chart:** Custom Recharts multi-series radar visualization benchmarking candidates against each other and industry standards.
- **Dimension Differential Metrics:** Category-by-category leader identification and comparative horizontal progress meters across 5 core competencies.
- **Live Coding Face-Off:** Side-by-side technical evaluation comparing problem solutions, test suite pass rates (e.g. 3/3), and asymptotic complexity.
- **Biometric & Vision Comparison:** Direct comparison of MediaPipe gaze stability, head pose compliance, and script-reading flags.
- **Enterprise ATS Data Exporter:** One-click generation of Greenhouse CSV, Lever CSV, and universal ATS JSON payloads (`atsExporter.js` and `/api/recruiter/candidates/export-ats`).

### Phase 5C: AWS S3 Direct Presigned Streaming & Production Docker ✅ [IMPLEMENTED]
- **AWS S3 Presigned PUT Engine:** Pure Node.js crypto AWS Signature Version 4 implementation for zero-overhead direct client-to-bucket uploads.
- **Multi-Cloud Storage Broker:** Supports AWS S3, Cloudinary video uploads, and local stream pipelines (`/api/media/direct-upload/:token`).
- **Dynamic Client Streaming:** `cloudUploader.js` integrated into `useAnalyze` hook with real-time percentage upload progress callbacks.
- **Production Containerization:**
  - `backend/Dockerfile` (Node.js 18-alpine, secure non-root user, healthchecked).
  - `ml-service/Dockerfile` (Python 3.10-slim with FFmpeg binary & uvicorn).
  - `frontend/Dockerfile` (Multi-stage build with NGINX reverse-proxying & asset caching).
- **1-Command Docker Compose:** Orchestrates Frontend, Express API, FastAPI ML Service, and MongoDB with healthchecks and volume persistence.
- **Deployment Template:** Turnkey root `.env.example` file.

### Phase 6: Autonomous Gemini ATS Resume Screening Microservice 🚀 [PLANNED]
*(Detailed Engineering Blueprint: [RESUME_ATS_SCREENER_PLAN.md](file:///c:/Users/admin/OneDrive/Desktop/Debrief-ai/RESUME_ATS_SCREENER_PLAN.md))*
- **Dedicated Microservice:** High-concurrency FastAPI service (`resume-service`) leveraging **Google Gemini GenAI** with structured Pydantic JSON schemas.
- **Polyglot Persistence:** PostgreSQL container + SQLAlchemy schema for structured job requirements, applicant ATS metrics, and scoring audit trails alongside MongoDB.
- **Multi-Format Ingestion:** High-fidelity PDF/DOCX parsing (`pdfplumber`, `python-docx`) with formatting sanitization and prompt injection defenses.
- **Rubric Scoring Engine:** Weighted ATS match calculation (Hard Skills 40%, Experience 30%, Education 15%, Clarity 15%) + skill gap analysis and red flag detection.
- **Autonomous Pipeline Funnel:** Automatically qualifies top-scoring applicants (score $\ge$ 75%) and issues unique tokens directly into Debrief's proctored AI video interview pipeline.
- **Recruiter Resume Hub:** Modern React UI with interactive SVG match gauges, green/red skill pills, and one-click interview advancement.

---

## 🏗️ Updated System Architecture

```text
[ Recruiter UI (React) ]
    ├── Upload Job Description & Candidate Resumes
    └── View ATS Rankings & Candidate Video Scorecards
          │
          ▼
[ Node.js/Express API Gateway ]
    ├── Handles Auth (Clerk)
    ├── Dispatches to Resume & Interview Microservices
    └── Saves Metadata to MongoDB & Dispatches Automated Invite Tokens
          │
          ├────────────────────────────────────────┐
          ▼                                        ▼
[ FastAPI Resume Screener (Port 8001) ]    [ Python/FastAPI ML Service (Port 8000) ]
    ├── PDF/DOCX Extraction (pdfplumber)       ├── FFmpeg (Audio Extraction)
    ├── Google Gemini GenAI (Structured)       ├── Whisper (Speech to Text)
    ├── ATS Scoring & Skill Gap Engine         ├── MediaPipe Gaze & Head Pose Tracking
    └── PostgreSQL (Relational Audit/Metrics)  └── LLM (STAR Rubric Answer Evaluation)
```

---

## 💡 Pitching This for Your Final Year Project
When presenting this to your professors and viva examiners, frame it as a **"Full-Cycle Autonomous AI Talent Acquisition Platform"**:
- **The Problem:** Traditional hiring is fractured. Existing ATS tools use dumb keyword matching, leading to high false-negative rates, and are completely disconnected from the actual interview and proctoring stage.
- **The Solution:** An end-to-end autonomous pipeline that:
  1. Screens resumes semantically with **Google Gemini GenAI** (eliminating keyword stuffing).
  2. Employs **Polyglot Architecture** (PostgreSQL for relational ATS evaluations + MongoDB for video telemetry/transcripts).
  3. Automatically promotes qualified candidates into a **Proctored AI Video Interview** with real-time MediaPipe anti-cheat and live coding verification.
  4. Generates a unified, data-driven hiring decision scorecard for HR.
