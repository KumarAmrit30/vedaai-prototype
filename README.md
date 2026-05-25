# VedaAI

AI-powered assessment generator for educators. VedaAI creates structured assignment papers using Gemini, processes generation asynchronously with BullMQ, and provides a modern dashboard to manage assignments.

## Project Overview

VedaAI is a full-stack prototype that lets users configure an assignment (topic, due date, question settings), queue AI generation in the background, and track status from a web dashboard. Generated papers are stored as validated JSON in MongoDB — never as raw LLM markdown.

## Tech Stack

**Frontend**
- Next.js 16 (App Router)
- TypeScript
- TailwindCSS
- Zustand (state management)
- Axios
- react-hot-toast

**Backend**
- Express.js + TypeScript
- MongoDB + Mongoose
- Redis + BullMQ
- Google Gemini 1.5 Flash
- Zod (AI response validation)

## Architecture

```
┌─────────────┐     REST      ┌─────────────┐     enqueue    ┌─────────────┐
│   Next.js   │ ────────────► │   Express   │ ─────────────► │   BullMQ    │
│  Dashboard  │               │     API     │                │   Worker    │
└─────────────┘               └──────┬──────┘                └──────┬──────┘
                                     │                              │
                                     ▼                              ▼
                               ┌──────────┐                  ┌──────────┐
                               │ MongoDB  │ ◄────────────────│  Gemini  │
                               └──────────┘    save paper     └──────────┘
                                     ▲
                                     │
                               ┌──────────┐
                               │  Redis   │
                               └──────────┘
```

## Features Implemented

- Assignment creation with configurable question settings
- Background AI generation via BullMQ workers
- Structured JSON output validated with Zod
- Assignment status lifecycle: `pending` → `generating` → `completed` / `failed`
- Dashboard listing with status badges
- MongoDB embedded document model for generated papers

## Monorepo Structure

```
vedaai-prototype/
├── backend/          Express API, workers, AI services
├── frontend/         Next.js dashboard
├── PROJECT_PROGRESS.md
└── README.md
```

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # add your credentials
npm run dev            # http://localhost:8000
```

**Scripts:** `dev` · `build` · `start` · `lint`

## Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev            # http://localhost:3000
```

**Scripts:** `dev` · `build` · `start` · `lint` · `typecheck`

## Environment Variables

**Backend** (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `8000`) |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis URL (`rediss://` for Upstash) |
| `GEMINI_API_KEY` | Google Gemini API key |

**Frontend** (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:8000/api`) |

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/assignments` | Create assignment + queue generation |
| `GET` | `/api/assignments` | List all assignments (newest first) |
| `GET` | `/api/assignments/:id` | Get assignment by ID |

## Current Status

**Day 1 complete.** End-to-end vertical slice works: create assignment from the dashboard → worker generates and persists structured paper → dashboard lists assignments with status.

See [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md) for detailed phase tracking.

## Upcoming Work

- Generated paper detail view
- Real-time status updates (Socket.IO)
- Dynamic prompts from assignment configuration
- PDF export
- Form validation and UX polish

## License

ISC (prototype)
