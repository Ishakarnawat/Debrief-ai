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

### 2. 🛡️ Candidate Screening & Proctoring (For Recruiters)
- **Anti-Cheat System:** Detect multiple faces in the frame, background voices, or tab-switching (browser visibility API).
- **Automated Scoring:** The AI evaluates answers against a rubric (e.g., technical accuracy, STAR method usage) and assigns a score out of 100.
- **Recruiter Dashboard:** A KanBan board or ranking table sorting candidates by their AI-generated scores.

### 3. 🤖 Real-Time Interactive AI Interviewer
- Instead of just uploading static files, the platform features a conversational UI where an AI (using OpenAI Realtime API or standard Whisper + GPT-4 setup) asks dynamic follow-up questions based on the candidate's previous answers.

### 4. 💻 Live Coding Environment (Optional but Impressive)
- Split screen: Video recording on one side, and a Monaco Editor (VS Code in browser) on the other. Code execution via an API (e.g., Judge0) so the AI can evaluate the code logic *and* the candidate's verbal explanation simultaneously.

---

## 🎨 UI/UX Revamp Ideas

To make it look like a premium, modern SaaS product:
- **Dark Mode by Default:** Sleek, professional dark UI with neon accents (Tailwind CSS).
- **Dashboard Analytics:** Use `Recharts` or `Chart.js` for radar charts showing candidate skills (e.g., Communication, Technical, Confidence).
- **Interview Room Interface:** Similar to Google Meet or Zoom, but with a floating AI widget, timer, and subtle real-time feedback indicators.
- **Post-Interview Report:** A highly visual, downloadable PDF report (using `react-pdf`) summarizing the feedback.

---

## 📅 Suggested Development Phases

### Phase 1: Video Capture & Storage (Weeks 1-2)
- **Frontend:** Implement the camera UI using `react-webcam` or native WebRTC. Add permissions handling for mic/camera.
- **Backend/Cloud:** Stream or upload recorded video chunks to AWS S3 or Cloudinary.
- **Database:** Update MongoDB schema to support `VideoInterview` models, linking recruiters to candidates.

### Phase 2: Core Video AI Processing (Weeks 3-4)
- **ML Service:** Integrate facial detection (MediaPipe) in the FastAPI backend to extract frames and analyze eye-tracking/emotions.
- **Audio Extraction:** Extract audio from the video file using FFmpeg, pass it to Whisper for transcription, and then to LLM for STAR method analysis.
- **Result Aggregation:** Combine video insights (confidence, eye contact) and audio insights (filler words, answer quality) into a single score.

### Phase 3: The Recruiter Workflow & Proctoring (Weeks 5-6)
- **Role-based Auth:** Setup Clerk to separate `Recruiter` and `Candidate` roles.
- **Link Generation:** Recruiters can create unique interview links and send them to candidates.
- **Proctoring Features:** Implement browser tab-switching detection and multiple-face detection in the ML service.
- **Recruiter Dashboard:** Build the UI for recruiters to view a ranked list of candidates with their AI summary reports.

### Phase 4: Polish, UI Changes & Advanced Features (Weeks 7-8)
- Implement interactive charts on the dashboards.
- Add conversational AI interviewer (TTS reading out questions).
- Generate a comprehensive PDF report.
- Extensive bug testing and mock interviews to tune the AI prompts.

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
