# IntellMeet 🚀
### AI-Powered Enterprise Meeting & Collaboration Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-Passing-emerald)](.github/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/Tests-17%20Passed-brightgreen)](server/tests/api.test.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](tsconfig.json)

IntellMeet is a modern, production-grade enterprise video conferencing and collaboration platform designed with the **MERN** stack (MongoDB, Express, React, Node.js with TypeScript), **Socket.io** & **WebRTC** mesh signaling for real-time video/audio/chat, and an **AI Meeting Intelligence Engine** that processes meeting audio transcripts into structured summaries, key decisions, and actionable Kanban tasks.

---

## 🌟 Key Features

1. **Enterprise Authentication & Security**:
   - Short-lived JWT access tokens + secure refresh token rotation.
   - Argon2/Bcrypt password hashing, parameterized validation with Zod.
   - Helmet security headers, CORS origin protection, and centralized error handling.

2. **Real-Time WebRTC Video & Audio Conferencing**:
   - Mesh P2P WebRTC media streams with Socket.io signaling.
   - Dynamic media controls: Microphone mute/unmute, Camera toggle, and Native Screen Sharing.
   - Responsive multi-peer gallery grid with active participant status and badges.

3. **In-Meeting Real-Time Chat & Presence**:
   - Instant messaging with Socket.io synchronization.
   - Real-time typing indicators and persistent chat history in database.

4. **AI Meeting Intelligence & Automated Action Items**:
   - Live transcript ingestion with NLP analysis.
   - Extraction of **Executive Summaries**, **Key Decisions**, and **Action Items** with assignees and due dates.
   - Robust offline/fallback NLP summarizer + Google Gemini API integration support.

5. **Integrated Team Collaboration & Kanban Task Board**:
   - 1-Click push from AI Meeting Action Items directly into the team Kanban board.
   - Multi-column status workflow (`To Do` -> `In Progress` -> `Completed`).
   - Priority indicators (High, Medium, Low) and assignee tagging.

6. **Post-Meeting Intelligence & Analytics Dashboard**:
   - Platform-wide statistics: Active sessions, task completion rates, and participant session volume.
   - Visual health monitoring for WebRTC mesh, signaling server, and database connectivity.

---

## 🏗️ Repository Architecture

```
intellmeet/
├── client/                     # Frontend React (Vite + TypeScript + CSS Design System)
│   ├── src/
│   │   ├── api/                # API client with JWT interceptor
│   │   ├── components/         # Glassmorphic Navbar & shared UI components
│   │   ├── features/
│   │   │   ├── auth/           # Login / Register modal with validation
│   │   │   ├── meetings/       # Meeting Lobby & WebRTC Video Meeting Room
│   │   │   ├── tasks/          # Interactive Kanban board
│   │   │   └── analytics/      # Metric cards & system health overview
│   │   ├── App.tsx             # Root routing and session state
│   │   └── index.css           # Curated design tokens & glassmorphism
│   ├── vite.config.ts
│   └── package.json
│
├── server/                     # Backend API & Real-time Signaling (Node + Express + TS)
│   ├── src/
│   │   ├── config/             # MongoDB Mongoose connection with fallback
│   │   ├── controllers/        # Auth, Meeting, AI, Task, Team & Analytics controllers
│   │   ├── middleware/         # JWT authentication, Zod validation, Error handlers
│   │   ├── models/             # Mongoose schemas (User, Meeting, Message, Task, etc.)
│   │   ├── routes/             # RESTful API endpoints
│   │   ├── services/
│   │   │   ├── ai/             # AI Meeting Intelligence Engine
│   │   │   └── storage/        # Abstract Repository pattern (ECC standard)
│   │   ├── sockets/            # Socket.io WebRTC signaling & real-time chat
│   │   ├── app.ts              # Express application factory
│   │   └── server.ts           # Server entrypoint
│   ├── tests/                  # Automated integration & security test suite (Vitest)
│   └── package.json
│
├── shared/                     # Shared TypeScript domain contracts & API envelopes
│   └── types/index.ts
│
├── docker/                     # Docker container definitions
│   ├── Dockerfile.server
│   └── Dockerfile.client
├── docker-compose.yml          # Multi-container orchestration (Mongo, Server, Client)
└── .github/workflows/ci.yml    # Continuous Integration testing & build pipeline
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- (Optional) MongoDB running locally or MongoDB Atlas connection string (in-memory persistence automatically activates if MongoDB is offline)

### Installation & Local Setup

1. **Clone or enter the `intellmeet` folder**:
   ```bash
   cd intellmeet
   ```

2. **Install dependencies**:
   ```bash
   # Install server dependencies
   cd server && npm install

   # Install client dependencies
   cd ../client && npm install
   ```

3. **Configure Environment Variables**:
   In `server/`:
   ```bash
   cp .env.example .env
   ```

4. **Run the Backend Server**:
   ```bash
   cd server
   npm run dev
   ```
   *The server starts on `http://localhost:5000` with Socket.io signaling.*

5. **Run the Frontend Client** (in a separate terminal):
   ```bash
   cd client
   npm run dev
   ```
   *The frontend starts on `http://localhost:5173`.*

---

## 🧪 Testing (ECC Test-Driven Verification)

The project includes an end-to-end integration and API test suite verifying all routes, input validations, security boundaries, and AI engines:

```bash
cd server
npm test
```

**Verification Results**:
- ✅ `GET /api/health` - Healthy system and database state
- ✅ `POST /api/auth/register` - Rejects invalid payloads & registers user
- ✅ `POST /api/auth/login` - Secure credential validation & token issue
- ✅ `GET /api/auth/users/me` - Authenticated profile verification
- ✅ `POST /api/meetings` - Meeting creation and passcode management
- ✅ `GET /api/meetings` & `GET /api/meetings/:id` - Meeting listings and details
- ✅ `POST /api/meetings/:id/ai-summary` - AI NLP summarization & action item extraction
- ✅ `POST /api/tasks` & `PATCH /api/tasks/:id` - Kanban task creation and status shifts
- ✅ `GET /api/analytics` - Computed metrics and health telemetry

---

## 🐳 Docker Deployment

To launch the full stack (Client, Server, MongoDB) using Docker Compose:

```bash
docker-compose up --build -d
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- MongoDB: `localhost:27017`

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
