# VedaAI Assessment Creator

**AI-powered assessment generator for educators.** Configure assignments, upload study materials, and receive structured question papers — generated asynchronously with real-time progress updates.

> Built as a production-minded full-stack prototype: async job processing, WebSocket sync, optimistic UI, and validated AI output stored as JSON — never raw markdown.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [AI Generation Pipeline](#ai-generation-pipeline)
- [BullMQ + Redis Workflow](#bullmq--redis-workflow)
- [Socket.IO Realtime Flow](#socketio-realtime-flow)
- [PDF/TXT Upload Grounding](#pdftxt-upload-grounding)
- [Soft Delete Architecture](#soft-delete-architecture)
- [PDF Export System](#pdf-export-system)
- [Mobile Support](#mobile-support)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Engineering Highlights](#engineering-highlights)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Screenshots](#screenshots)
- [QA Checklist](#qa-checklist)
- [Project Structure](#project-structure)

---

## Overview

VedaAI lets educators create assessment papers through a guided workflow:

1. **Configure** assignment details (topic, due date, question type, counts, marks)
2. **Upload** optional PDF or TXT source material to ground AI generation
3. **Generate** questions asynchronously via a background worker
4. **Track** live progress over WebSockets
5. **Review, export, and manage** completed papers from a responsive workspace

The system separates **fast API responses** from **slow AI work**, keeping the UI responsive while Gemini generates structured assessments in the background.

---

## Features

| Area | Capabilities |
|------|-------------|
| **Assignment creation** | Multi-step flow: details → upload → generate → preview |
| **AI generation** | Google Gemini with Zod-validated JSON output |
| **Source grounding** | PDF/TXT upload → text extraction → prompt injection |
| **Realtime updates** | Socket.IO progress, completion, failure, delete events |
| **Workspace** | Dashboard stats, search, filters, sort, bulk actions |
| **Lifecycle** | `pending` → `generating` → `completed` / `failed` |
| **Soft delete** | Recoverable MongoDB records; hidden from all active queries |
| **Optimistic UI** | Instant delete with undo; socket-confirmed state |
| **PDF export** | Client-side html2canvas + jsPDF download (no print dialog) |
| **Responsive shell** | Desktop sidebar, tablet layout, mobile bottom nav |

---

## Architecture

### System diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 15)                           │
│  App Router · Zustand · Axios · Socket.IO Client · Tailwind CSS         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ REST API (JSON / multipart)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Backend (Express 5)                             │
│  Controllers · Multer upload · Serializers · Socket.IO server           │
└───────┬─────────────────────────────┬───────────────────────────────────┘
        │ enqueue job                 │ persist / query
        ▼                             ▼
┌───────────────┐               ┌───────────────┐
│  BullMQ Queue │◄──────────────│    MongoDB    │
│  (Redis)      │               │  Assignments  │
└───────┬───────┘               └───────────────┘
        │ dequeue
        ▼
┌───────────────┐     generate      ┌───────────────┐
│    Worker     │ ────────────────► │  AI Service   │
│  (BullMQ)     │ ◄──────────────── │  (Gemini)     │
└───────┬───────┘   structured JSON └───────────────┘
        │
        │ emit events
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Socket.IO  ──►  assignment:processing | completed | failed | deleted   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
                         Frontend (live Zustand updates)
```

### Request lifecycle (create assignment)

```
User submits form + optional files
        │
        ▼
POST /api/assignments  ──►  Parse PDF/TXT  ──►  Save to MongoDB (pending)
        │                                              │
        │                                              ▼
        │                                    Enqueue BullMQ job
        │                                              │
        ▼                                              ▼
201 + assignmentId                          Worker picks up job
        │                                              │
        ▼                                              ▼
Socket: assignment:processing (5→20→85→100)   Gemini + Zod parse
        │                                              │
        ▼                                              ▼
Socket: assignment:completed                  Save generatedPaper
        │
        ▼
Preview + PDF export available
```

---

## Tech Stack

### Frontend (`/frontend`)

| Technology | Role |
|------------|------|
| **Next.js 15** | App Router, SSR/CSR hybrid |
| **React 19** | UI components |
| **TypeScript** | End-to-end type safety |
| **Tailwind CSS 4** | Design system & responsive layout |
| **Zustand** | Assignment + workspace state |
| **Axios** | REST client |
| **Socket.IO Client** | Realtime generation & mutation sync |
| **react-hot-toast** | Non-blocking notifications |
| **jspdf + html2canvas** | Client-side PDF export |
| **lucide-react** | Icons |

### Backend (`/backend`)

| Technology | Role |
|------------|------|
| **Express 5** | REST API |
| **TypeScript** | Typed controllers & services |
| **MongoDB + Mongoose** | Assignment persistence |
| **Redis + BullMQ** | Async job queue & workers |
| **Socket.IO** | Realtime event broadcast |
| **Google Gemini** | LLM question generation |
| **Zod** | AI response schema validation |
| **Multer** | Multipart file upload |
| **pdf-parse** | PDF text extraction |

---

## AI Generation Pipeline

1. **Input assembly** — Title, topic, instructions, question config, and optional `materialText` (from upload or body).
2. **Prompt construction** — When material is present, the prompt includes:
   > *Use the following study material while generating questions:*
   >
   > Material is truncated to **50,000 characters** before injection.
3. **Gemini call** — Single completion request via `@google/generative-ai`.
4. **Response parsing** — Raw text is cleaned (strips markdown fences) and validated with Zod:
   - Sections with titles and instructions
   - Questions with difficulty (`easy` | `medium` | `hard`) and marks
5. **Persistence** — Validated `generatedPaper` JSON is saved to MongoDB; status → `completed`.
6. **Failure handling** — Up to 3 retries with exponential backoff; final failure sets `status: failed` and emits `assignment:failed`.

---

## BullMQ + Redis Workflow

| Step | Detail |
|------|--------|
| **Queue name** | `assignment-generation` |
| **Job ID** | Same as `assignmentId` (idempotent enqueue) |
| **Retries** | 3 attempts, exponential backoff (5s base) |
| **Worker** | Processes job → updates progress → calls AI → saves result |
| **Cleanup** | Temp upload files deleted in worker `finally` block |
| **Shutdown** | Graceful close: worker → queue → socket → HTTP → Redis → MongoDB |

**Local Redis:** run `redis-server` on port 6379, or set `REDIS_URL`.

---

## Socket.IO Realtime Flow

The backend broadcasts global events; the frontend subscribes once in `AppShell` and patches Zustand.

| Event | Trigger | Frontend action |
|-------|---------|-----------------|
| `assignment:processing` | Worker progress update | Set status `generating`, update `progress` |
| `assignment:completed` | Paper saved | Set status `completed`, attach `generatedPaper` |
| `assignment:failed` | Retries exhausted | Set status `failed` |
| `assignment:updated` | Status patch / bulk update | Merge partial update |
| `assignment:deleted` | Soft delete | Remove from store, clear selection |

Socket URL defaults to the API host (strip `/api` suffix) unless `NEXT_PUBLIC_SOCKET_URL` is set.

---

## PDF/TXT Upload Grounding

| Format | Handling |
|--------|----------|
| **PDF** | `pdf-parse` extracts raw text |
| **TXT** | Read as UTF-8 |
| **Limits** | 10 MB per file, up to 3 files, PDF + TXT only |
| **Storage** | Temp files in `/tmp/uploads`; deleted after parsing |
| **MongoDB fields** | `materialText`, `materialSourceType`, `originalFileName` |
| **API exposure** | `materialText` never returned to clients (serializer strips it) |

Uploaded content directly influences generated questions — the AI is instructed to stay faithful to the source material.

---

## Soft Delete Architecture

Assignments are never hard-deleted from MongoDB during normal operation.

| Field | Purpose |
|-------|---------|
| `isDeleted: true` | Marks record as deleted |
| `deletedAt` | Timestamp of deletion |

**All active reads** use `{ isDeleted: { $ne: true } }` via centralized query helpers. The serializer additionally blocks deleted documents. Deleted assignment detail routes return **404**. Socket `assignment:deleted` keeps all connected clients in sync.

---

## PDF Export System

Export uses a **client-side capture pipeline** (no server PDF library, no browser print dialog):

1. Renders a dedicated `AssignmentPdfExport` component inside an isolated iframe
2. Uses **inline hex colors only** — safe for html2canvas (no CSS variables or `color-mix()`)
3. Captures the document in vertical chunks via **html2canvas**
4. Assembles multi-page **A4 PDF** with **jsPDF** (10 mm margins, JPEG 0.92 quality)
5. Triggers a direct file download with a sanitized filename (e.g. `penetration-testing-assignment.pdf`)

The on-screen preview (`AssignmentPaper`) is unchanged; export runs off-screen so theme styles never break capture.

**Key files:** `assignment-pdf-export.tsx`, `export-assignment-pdf.tsx`, `export-pdf-colors.ts`

---

## Mobile Support

| Area | Behavior |
|------|----------|
| **Navigation** | Bottom nav + floating create button on small screens; sidebar on desktop |
| **Safe areas** | `env(safe-area-inset-*)` padding for iPhone notch/home indicator |
| **Layout** | Single-column assignment detail; sticky sidebar only at `lg+` breakpoints |
| **Overflow** | Horizontal scroll prevented on shell; filter/sort pills scroll horizontally when needed |
| **PDF export** | Same download pipeline on mobile Safari and Chrome — no print dialog |
| **Touch** | Long-press to enter selection mode; adequate tap targets on action buttons |

Test at **375px**, **768px**, and **1280px** widths before submission.

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Redis** (local or [Upstash](https://upstash.com/))
- **Google Gemini API key** ([Google AI Studio](https://aistudio.google.com/))

### 1. Clone and install

```bash
git clone <repository-url>
cd vedaAI_prototype
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in credentials
npm run dev            # http://localhost:8000
```

Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 3. Redis

```bash
redis-server
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

### Scripts

| Package | Command | Description |
|---------|---------|-------------|
| Backend | `npm run dev` | Hot-reload dev server |
| Backend | `npm run build` | Compile TypeScript |
| Backend | `npm start` | Run compiled server |
| Frontend | `npm run dev` | Next.js dev server |
| Frontend | `npm run build` | Production build |
| Frontend | `npm start` | Production server |
| Frontend | `npm run typecheck` | TypeScript check |

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | Yes* | Redis URL (`redis://localhost:6379` or Upstash `rediss://...`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `CLIENT_URL` | No | Frontend origin for CORS + Socket.IO (default `http://localhost:3000`) |
| `PORT` | No | HTTP port (default `8000`) |
| `REDIS_HOST` | No | Fallback if `REDIS_URL` unset (default `127.0.0.1`) |
| `REDIS_PORT` | No | Fallback if `REDIS_URL` unset (default `6379`) |

\* Use either `REDIS_URL` **or** `REDIS_HOST` + `REDIS_PORT`.

### Frontend — `frontend/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | API base URL (default `http://localhost:8000/api`) |
| `NEXT_PUBLIC_SOCKET_URL` | No | Socket.IO server URL (default: API host without `/api`) |

---

## API Overview

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/assignments` | Create assignment + enqueue generation (JSON or `multipart/form-data`) |
| `GET` | `/assignments` | List active assignments (newest first) |
| `GET` | `/assignments/:id` | Get assignment by ID (404 if soft-deleted) |
| `DELETE` | `/assignments/:id` | Soft-delete assignment |
| `PATCH` | `/assignments/:id/status` | Update status (`pending`, `completed`, `failed`) |
| `POST` | `/assignments/bulk-delete` | Bulk soft-delete |
| `POST` | `/assignments/bulk-status` | Bulk status update |

### POST `/assignments` (multipart)

```
Content-Type: multipart/form-data

Fields:
  title, topic, dueDate, instructions
  questionConfig  (JSON string)
  materials[]     (optional PDF/TXT files, max 3)
```

**Response (201):**

```json
{
  "success": true,
  "assignmentId": "...",
  "jobId": "...",
  "status": "pending",
  "data": { ... }
}
```

---

## Engineering Highlights

- **Async queue processing** — API returns immediately; heavy AI work runs in BullMQ workers with retry semantics.
- **Realtime WebSocket sync** — Generation progress and mutations propagate to all open tabs without polling.
- **Optimistic UI** — Deletes remove cards instantly with undo; sockets and API confirm final state.
- **Structured AI parsing** — Zod validates every LLM response; invalid JSON never reaches the database.
- **Upload grounding** — PDF/TXT extraction feeds the prompt so questions reflect actual study material.
- **Responsive workspace architecture** — Shared `AppShell` with desktop sidebar, tablet topbar, and mobile bottom navigation.
- **Defensive soft-delete filtering** — Centralized query helpers + serializer guards prevent deleted records from resurfacing.
- **Graceful shutdown** — Worker, queue, socket, and DB connections close cleanly on `SIGTERM` / `SIGINT`.

---

## Deployment

### Live demo

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | _Add your production URL_ |
| **Backend (Render)** | _Add your production API URL_ |

### Platform guide

| Service | Recommended platform | Notes |
|---------|---------------------|-------|
| **Frontend** | [Vercel](https://vercel.com) | Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to production backend |
| **Backend** | [Render](https://render.com) or [Railway](https://railway.app) | Run `npm run build && npm start`; expose WebSocket on same port |
| **MongoDB** | [MongoDB Atlas](https://www.mongodb.com/atlas) | Free tier works for demos |
| **Redis** | [Upstash](https://upstash.com) | Use `rediss://` URL in `REDIS_URL` |

### Render cold-start note

Render free/starter tiers **spin down after inactivity**. The first request after idle can take **30–60+ seconds** while the service wakes up. During cold start:

- API health checks may time out briefly
- Assignment creation may appear slow until the backend is warm
- Socket.IO reconnects automatically once the server is available

For demos, hit `/api/health` once before presenting, or upgrade to a always-on plan.

### Production checklist

- [ ] Set all backend env vars on host (including `CLIENT_URL` for CORS)
- [ ] Set frontend `NEXT_PUBLIC_*` vars on Vercel
- [ ] Use TLS (`https` / `wss`) in production URLs
- [ ] Confirm Redis and MongoDB are reachable from backend host
- [ ] Run a test assignment end-to-end after deploy
- [ ] Verify PDF export on mobile Safari

---

## Known Limitations

| Limitation | Detail |
|------------|--------|
| **AI output** | Quality depends on Gemini; occasional retries may be needed |
| **Material size** | Uploaded text truncated to 50,000 characters in prompts |
| **PDF parsing** | Scanned/image-only PDFs may extract little or no text |
| **PDF export** | Very long papers use chunked capture; extremely large assignments may take longer |
| **Realtime** | Requires WebSocket connectivity; brief disconnects show a reconnect toast |
| **Cold start** | Render free tier adds latency on first request after idle |
| **Concurrent jobs** | Single worker process; heavy parallel generation queues sequentially |

---

## Screenshots

> Add images to `docs/screenshots/` and replace placeholders below.

| Dashboard | Assignment Creation | Generation State |
|:---------:|:-------------------:|:----------------:|
| ![Dashboard placeholder](./docs/screenshots/dashboard.png) | ![Create placeholder](./docs/screenshots/create.png) | ![Generating placeholder](./docs/screenshots/generating.png) |
| Home stats & recent assignments | Multi-step create flow | Live progress via WebSocket |

| Generated Paper | Mobile UI |
|:---------------:|:---------:|
| ![Paper placeholder](./docs/screenshots/paper.png) | ![Mobile placeholder](./docs/screenshots/mobile.png) |
| Structured sections & PDF export | Responsive shell with bottom nav |

---

## QA Checklist

See **[QA_CHECKLIST.md](./QA_CHECKLIST.md)** for the full pre-submission testing matrix covering assignments, uploads, realtime, PDF export, responsive layouts, and deployment verification.

---

## Project Structure

```
vedaAI_prototype/
├── backend/
│   ├── src/
│   │   ├── modules/assignment/   # Routes, controller, model, serializer
│   │   ├── queues/               # BullMQ queue + worker
│   │   ├── services/             # AI, material parser
│   │   ├── socket/               # Socket.IO events
│   │   └── middleware/           # Upload, error handling
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   ├── components/           # UI, assignment, workspace, layout
│   │   ├── hooks/                # Loaders, socket, navigation
│   │   ├── lib/                  # API, socket, utils
│   │   └── store/                # Zustand stores
│   └── .env.example
├── PROJECT_PROGRESS.md           # Phase-by-phase build log
└── README.md
```

---

## License

ISC — prototype / portfolio project.
