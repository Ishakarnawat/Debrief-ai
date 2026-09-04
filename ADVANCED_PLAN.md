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

---

## 🏗️ Updated System Architecture

```text
[ Candidate Browser ]
   ├── WebRTC/Camera (Records Video)
   ├── Tab-Switch Listener (Proctoring)
   └── React UI (Interview Room)
         │
         ▼
[ Node.js/Express API Gateway ]
   ├── Handles Auth (Clerk)
   ├── Generates Presigned S3 URLs
   └── Saves Metadata to MongoDB
         │
         ▼
[ Cloud Storage (AWS S3) ] <--- Video File Stored
         │
         ▼
[ Python/FastAPI ML Service ]
   ├── FFmpeg (Audio Extraction)
   ├── Whisper (Speech to Text)
   ├── MediaPipe/OpenCV (Facial/Eye Analysis)
   └── LLM (Answer grading, STAR analysis)
         │
         ▼
[ Recruiter Dashboard (React) ]
   └── Fetches aggregated JSON scores & insights
```

---

## 💡 Pitching This for Your Final Year Project
When presenting this to your professors, frame it as a **"B2B AI Hiring Assistant"** rather than just a practice tool. 
- **The Problem:** Manual initial screening is time-consuming for HR.
- **The Solution:** An asynchronous, AI-proctored video interview platform that reduces HR workload by 80% and provides unbiased, data-driven candidate rankings.
