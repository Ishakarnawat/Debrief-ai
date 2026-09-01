# 🎙️ Debrief.ai (Enterprise Edition) — AI-Powered Video Interview & Screening Platform

Debrief.ai is an advanced, AI-driven asynchronous video interview platform. Designed to bridge the gap between candidates seeking practice and recruiters looking to automate the initial screening process. The system records video interviews, analyzes speech and facial cues, detects potential cheating, and ranks candidates based on their performance.

---

## 🚨 The Problem

1. **For Recruiters:** Initial screening of hundreds of candidates is incredibly time-consuming and often subject to human bias.
2. **For Candidates:** They rarely get actionable feedback after rejections, leaving them unaware of shortcomings in communication clarity, structure (STAR method), or body language.

---

## 💡 The Solution

**Debrief.ai** acts as a fully automated AI HR Assistant:
- **Recruiters** create custom interview links and send them to candidates.
- **Candidates** record asynchronous video answers directly in their browser.
- **AI Engine** processes the video and audio to evaluate:
  - Technical accuracy and structural logic (STAR method).
  - Confidence, eye contact, and emotional cues.
  - Proctoring metrics (tab switching, background voices, multiple faces).
- **Recruiters** review a ranked dashboard of candidates with detailed AI-generated scorecards.

---

## ✨ Advanced Features (Final Year Project Highlights)

- 📹 **Live In-Browser Video Recording:** WebRTC and `MediaRecorder` API integration.
- 👁️ **Computer Vision Analytics:** Eye-tracking and emotion detection using MediaPipe/OpenCV to analyze body language.
- 🛡️ **AI Proctoring & Anti-Cheat:** Detects tab-switching, multiple faces, and anomalous background noise.
- 🧠 **Speech & Content Analysis:** OpenAI + Whisper integration for transcribing audio and evaluating answer quality, detecting filler words, and checking for structured responses.
- 📊 **Recruiter CRM Dashboard:** Sort, rank, and filter candidates based on automated AI scores (out of 100).
- 🌓 **Premium UI/UX:** Built with React, Tailwind CSS, Recharts for data visualization, and a dark-mode first design.

---

## 📁 Project Structure

```
debrief-ai/
├── backend/          ← Node.js + Express API (User Mgmt, Database, S3 Links)
├── ml-service/       ← FastAPI (Video Processing, Whisper, OpenCV, LLMs)
└── frontend/         ← React + Vite + Tailwind (Dashboards, Interview Room)
```

---

## ⚡ Quick Start (Local Development)

### 🔧 Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB
- Clerk Account (Authentication)
- AWS/Cloudinary (for Video Storage)
- FFmpeg installed locally

### 1️⃣ Backend Setup
```bash
cd backend
npm install
cp .env.example .env # Add Clerk & MongoDB keys
npm run dev
```

### 2️⃣ ML / AI Service
```bash
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env # Add Clerk publishable key
npm run dev
```

---

## 🔄 Advanced System Architecture

```text
[ Browser WebRTC ] ──(Video Stream)──> [ Cloud Storage (AWS S3) ]
       │                                       │
  (Tab Events)                                 ▼
       │                              [ FastAPI ML Service ]
       ▼                                ├── FFmpeg (Audio extraction)
[ Node.js Backend ] <──(AI Insights)──  ├── MediaPipe (Vision AI)
       │                                └── Whisper + LLM (NLP AI)
       ▼
[ MongoDB Database ] ──(Scores & Data)──> [ Recruiter Dashboard ]
```

---

## 🏆 Final Year Project / Hackathon Pitch

- **Real-World Utility:** Solves a massive pain point in the B2B SaaS HR space.
- **Deep Tech Stack:** Combines Full-Stack Web Development (MERN) with cutting-edge Machine Learning (Computer Vision + NLP).
- **Scalable Architecture:** Microservices design separating the IO-heavy Node backend from the CPU-heavy Python AI service.

---

## 👥 Team
- Team Code Crafters

## ⭐ If you like this project, give it a star!
