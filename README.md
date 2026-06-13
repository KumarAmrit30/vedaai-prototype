# ExamForge AI

**AI-Powered Exam & Assignment Generation Platform**

ExamForge AI helps educators, trainers, coaching institutes, and students generate professional exam papers, assignments, quizzes, and assessments from uploaded study material using AI.

Upload a syllabus, notes, or reference PDF — configure an exam pattern — and receive a structured, export-ready question paper in minutes. ExamForge AI combines a modern educator workspace with a production-grade async generation pipeline, real-time progress tracking, and client-side PDF export.

---

## Features

- Upload PDFs, notes, syllabus documents, and study material
- Generate complete question papers using AI
- Support for multiple exam patterns
- Competitive exam templates
- Board exam templates
- University examination templates
- Automatic PDF export
- Dark mode support
- Responsive design (desktop, tablet, and mobile)
- Firebase authentication
- Usage limits and plan management

---

## Supported Exam Types

### Competitive Exams

| Pattern | Description |
|---------|-------------|
| **NEET** | NTA-style medical entrance MCQs |
| **JEE Main** | NTA-style engineering entrance |
| **CUET** | Common University Entrance Test (UG) |
| **SSC** | Staff Selection Commission (CGL-style) |
| **Banking** | IBPS-style banking exams |
| **CAT** | MBA entrance pattern |
| **Railways** | RRB-style recruitment exams |

### Academic Exams

| Pattern | Description |
|---------|-------------|
| **CBSE** | CBSE board examination structure |
| **ICSE** | ICSE board examination structure |
| **University Exams** | Semester-style university papers |
| **Midterms** | Mid-semester assessments |
| **End Semester Exams** | Full end-semester papers |
| **Assignments** | Structured assignment papers |
| **Quizzes** | Short-form quiz generation |
| **Custom** | Flexible custom configuration |

Each pattern is backed by a **dynamic exam template engine** that controls section layout, difficulty distribution, question style, and answer-key richness.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│              Frontend — Next.js 15 · React 19 · TypeScript          │
│     App Router · Zustand · Socket.IO · Tailwind CSS · Firebase      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ REST + WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Backend — Node.js · Express 5                     │
│        Controllers · BullMQ Workers · Firebase Admin · Zod          │
└───────┬─────────────────────────────┬───────────────────────────────┘
        │                             │
        ▼                             ▼
┌───────────────┐               ┌───────────────┐
│ Redis/BullMQ  │               │   MongoDB     │
│  Job Queue    │               │  Assignments  │
└───────┬───────┘               └───────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│   AI Layer — Gemini 2.5 Flash · Vertex AI · (Groq optional)       │
└─────────────────────────────────────────────────────────────────────┘
```

### Frontend

- **Next.js** — App Router, server and client components
- **TypeScript** — End-to-end type safety
- **Tailwind CSS** — Custom Stitch design system, responsive layouts
- **Zustand** — Assignment and workspace state
- **Socket.IO Client** — Real-time generation progress
- **Firebase SDK** — Google Sign-In authentication

### Backend

- **Node.js**
- **Express 5**
- **TypeScript**
- **MongoDB + Mongoose** — Assignment and user persistence
- **Redis + BullMQ** — Async job queue and workers
- **Socket.IO** — Real-time event broadcast
- **Zod** — AI response validation

### AI

- **Gemini 2.5 Flash** — Primary model via Google AI Studio
- **Vertex AI** — Production GCP deployment path
- **Groq** — Optional development / fallback provider

### Database & Services

- **MongoDB** — Assignments, users, usage tracking
- **Firebase Authentication** — Google Sign-In
- **Redis** — BullMQ job queue

---

## Key Technical Highlights

- **Material compression pipeline** — Reduces prompt size by over 90% while preserving semantic content
- **Dynamic exam template engine** — Pattern-specific blueprints for NEET, JEE, CBSE, CUET, and more
- **Batch generation** — Section-by-section generation for large exams (180+ questions)
- **MCQ validation engine** — Ensures option count, structure, and question integrity
- **Difficulty distribution engine** — Template-driven easy / medium / hard mix
- **AI telemetry tracking** — Provider, model, and duration metrics per generation
- **Production-ready PDF export** — Isolated render tree with html2canvas + jsPDF (no print dialog)
- **Dark / light theme support** — Theme-aware app chrome with always-readable paper preview
- **Optimistic UI + WebSocket sync** — Instant feedback with server-confirmed state
- **Soft-delete architecture** — Recoverable assignment lifecycle
- **Plan eligibility system** — Configurable generation limits per plan

---

## Screenshots

> Add images to `docs/screenshots/` and replace placeholders below.

### Dashboard

![Dashboard](./docs/screenshots/dashboard.png)

*Educator home — metrics, recent activity, and quick actions.*

### Assignment Workspace

![Assignment Workspace](./docs/screenshots/workspace.png)

*Search, filter, sort, and manage all generated papers.*

### Assignment Detail

![Assignment Detail](./docs/screenshots/assignment-detail.png)

*Paper preview, metadata, and one-click PDF export.*

### Settings & Appearance

![Settings](./docs/screenshots/settings.png)

*Profile, appearance (light / dark / system), billing, and workspace preferences.*

---

## Roadmap

### Current Version (v1)

- AI paper generation with exam templates
- PDF export
- Educator dashboard
- Assignment workspace
- Dark mode
- Firebase authentication
- Usage limits and plan catalog
- Real-time generation progress
- Material upload grounding (PDF / TXT)

### Coming Soon

- Solution generation
- Resource Library
- Collaborative Groups
- Notifications
- Advanced Analytics
- Paid Plans & Checkout

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Redis** (local or [Upstash](https://upstash.com))
- **Firebase project** with Google Sign-In enabled
- **AI provider credentials** — Gemini API key, Vertex AI service account, or Groq API key

### 1. Clone the repository

```bash
git clone <repository-url>
cd vedaAI_prototype
```

### 2. Install backend dependencies

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Firebase and API URLs
```

### 4. Start Redis

```bash
redis-server
```

### 5. Start the backend

```bash
cd backend
npm run dev
# API: http://localhost:8000
# Health: http://localhost:8000/api/health
```

### 6. Start the frontend

```bash
cd frontend
npm run dev
# App: http://localhost:3000
```

### Scripts

| Package | Command | Description |
|---------|---------|-------------|
| Backend | `npm run dev` | Hot-reload development server |
| Backend | `npm run build` | Compile TypeScript |
| Backend | `npm start` | Run production server |
| Frontend | `npm run dev` | Next.js development server |
| Frontend | `npm run build` | Production build |
| Frontend | `npm start` | Production server |

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | Yes* | Redis URL (`redis://localhost:6379` or Upstash `rediss://...`) |
| `AI_PROVIDER` | No | `gemini`, `vertex`, or `groq` (default: `groq`) |
| `GEMINI_API_KEY` | When `AI_PROVIDER=gemini` | Google AI Studio API key |
| `GEMINI_MODEL` | No | Default `gemini-2.5-flash` |
| `GCP_PROJECT_ID` | When `AI_PROVIDER=vertex` | Google Cloud project ID |
| `VERTEX_LOCATION` | No | GCP region (default `asia-south1`) |
| `VERTEX_MODEL` | No | Default `gemini-2.5-flash` |
| `GOOGLE_APPLICATION_CREDENTIALS` | When `AI_PROVIDER=vertex` | Path to service account JSON |
| `GROQ_API_KEY` | When `AI_PROVIDER=groq` | Groq API key |
| `GROQ_MODEL` | No | Default `llama-3.3-70b-versatile` |
| `AUTH_ENABLED` | No | Set `true` to enforce Firebase auth (recommended for production) |
| `FIREBASE_PROJECT_ID` | When auth enabled | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | When auth enabled | Service account client email |
| `FIREBASE_PRIVATE_KEY` | When auth enabled | Service account private key |
| `CLIENT_URL` | No | Frontend origin for CORS (default `http://localhost:3000`) |
| `PORT` | No | HTTP port (default `8000`) |
| `AI_REQUEST_TIMEOUT_MS` | No | Provider timeout in ms (default `45000`) |

\* Use `REDIS_URL` or `REDIS_HOST` + `REDIS_PORT`.

### Frontend — `frontend/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | API base URL (default `http://localhost:8000/api`) |
| `NEXT_PUBLIC_SOCKET_URL` | No | Socket.IO URL (default: API host without `/api`) |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL for OpenGraph metadata |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |

---

## Project Status

| | |
|---|---|
| **Status** | Active Development |
| **Version** | v1.0 Launch Release |

ExamForge AI v1 is production-hardened for launch: honest analytics, theme-aware UI, validated AI output, async job processing, and export-ready paper generation.

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes with clear commit messages
4. Run type checks — `npm run build` in both `frontend/` and `backend/`
5. Open a pull request with a concise description of what changed and why

Please keep pull requests focused. For large features, open an issue first to discuss scope.

---

## License

ISC — see [backend/package.json](./backend/package.json).

---

Built with ❤️ using Next.js, Firebase, MongoDB, Gemini, and Vertex AI.
