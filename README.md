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
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Engineering Highlights](#engineering-highlights)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
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
| **PDF export** | Print-optimized layout via browser print-to-PDF |
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

Export uses a **print-to-PDF** approach (no server-side PDF library):

1. Renders a dedicated `AssignmentPrintRoot` off-screen
2. Applies print-optimized CSS (`@media print`)
3. Opens the browser print dialog with a sanitized filename
4. User saves as PDF from the dialog

This keeps the export pipeline lightweight and produces clean, branded output without additional backend dependencies.

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

| Service | Recommended platform | Notes |
|---------|---------------------|-------|
| **Frontend** | [Vercel](https://vercel.com) | Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to production backend |
| **Backend** | [Render](https://render.com) or [Railway](https://railway.app) | Run `npm run build && npm start`; expose WebSocket on same port |
| **MongoDB** | [MongoDB Atlas](https://www.mongodb.com/atlas) | Free tier works for demos |
| **Redis** | [Upstash](https://upstash.com) | Use `rediss://` URL in `REDIS_URL` |

### Production checklist

- [ ] Set all backend env vars on host
- [ ] Set frontend `NEXT_PUBLIC_*` vars on Vercel
- [ ] Enable CORS for frontend origin on backend
- [ ] Use TLS (`https` / `wss`) in production URLs
- [ ] Confirm Redis and MongoDB are reachable from backend host
- [ ] Run a test assignment end-to-end after deploy

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
