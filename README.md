pyth# 🎙️ Debrief.ai — Interview Rejection Analysis System

AI-powered interview coaching platform that analyzes your spoken answers and gives **instant, actionable feedback** on communication, structure, and hiring readiness.

---

## 🚨 Problem

Many candidates get rejected from interviews without understanding **why**.
They lack feedback on:

- Communication clarity
- Answer structure (STAR method)
- Confidence & filler words

---

## 💡 Solution

**Debrief.ai** helps candidates improve by:

- 🎧 Uploading interview audio responses
- 🧠 Using AI to analyze speech & structure
- 📊 Providing detailed feedback + hiring probability

---

## ✨ Key Features

- 🎤 Audio-based interview analysis
- 🧠 AI-powered feedback (Mock + OpenAI modes)
- 📊 Hiring probability score
- 🔍 Filler word detection
- ⭐ STAR method evaluation
- 📁 History dashboard (track improvement)

---

## 🖼️ Demo Flow

```
Upload Audio → AI Analysis → Feedback Dashboard → Improve → Repeat
```

---

## 📁 Project Structure

```
debrief-ai/
├── backend/          ← Node.js + Express API
├── ml-service/       ← FastAPI (AI + transcription)
└── frontend/         ← React + Vite + Tailwind
```

---

## ⚡ Quick Start (3 terminals)

### 🔧 Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB (local or Atlas)
- Clerk account

---

### 1️⃣ Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

---

### 2️⃣ ML Service

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

### 3️⃣ Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 🔐 Authentication Setup

Using **Clerk**

- Add `VITE_CLERK_PUBLISHABLE_KEY` in frontend
- Add `CLERK_SECRET_KEY` in backend

---

## 🧠 AI Modes

| Mode    | Description                   |
| ------- | ----------------------------- |
| Mock    | Works without API keys (demo) |
| OpenAI  | Real AI feedback              |
| Whisper | Real speech-to-text           |

---

## 🔄 System Architecture

```
Frontend → Backend → ML Service → Database → Dashboard
```

---

## 🌐 API Overview

### Backend

- POST `/api/analyze`
- GET `/api/history`

### ML Service

- POST `/analyze`
- GET `/health`

---

## 📦 Tech Stack

- Frontend: React, Tailwind
- Backend: Node.js, Express
- ML: FastAPI, Whisper
- Database: MongoDB
- Auth: Clerk

---

## 🎯 Use Case

- Students preparing for placements
- Mock interview practice
- Communication improvement

---

## 🏆 Hackathon Edge

- ✅ Works without paid APIs (mock mode)
- ⚡ Fast setup
- 📊 Real-world impact
- 🎯 Clear problem-solution fit

---

## 🎥 Demo Suggestion

Record answer for:

> “Tell me about a challenge you overcame”

Upload → Show AI feedback → Explain insights

---

## 👥 Team

- Team Code Crafters

---

## 📌 Future Scope

- Video interview analysis
- Emotion detection
- Resume + interview alignment
- Company-specific feedback

---

## ⭐ If you like this project, give it a star!
