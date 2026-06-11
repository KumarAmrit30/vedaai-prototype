# ExamForge AI — Project Progress

**Last updated:** June 2026  
**Repository:** [vedaai-prototype](https://github.com/KumarAmrit30/vedaai-prototype)

## Completed — Backend

- [x] Express + TypeScript bootstrap (CommonJS)
- [x] Modular API structure (routes, controllers, middleware)
- [x] MongoDB connection via Mongoose
- [x] Redis client (Upstash-compatible `rediss://`)
- [x] BullMQ queue + worker for assignment generation
- [x] Pluggable AI providers (Gemini default, Groq optional)
- [x] Configurable Gemini model (`GEMINI_MODEL`, default `gemini-2.5-flash`)
- [x] Provider-level request timeout (`AI_REQUEST_TIMEOUT_MS`, default 45s)
- [x] Provider-level lightweight retry (2 attempts, transient failures only)
- [x] AI prompt builder + Zod response parser with structured parse/validation logs
- [x] Generation lifecycle logging (`[AI][GENERATION]` Started / Completed / Failed)
- [x] Generated question count validated against requested `numberOfQuestions`
- [x] Assignment Mongoose model (embedded sections/questions)
- [x] Assignment APIs: `POST`, `GET` list, `GET` by ID, delete, bulk actions
- [x] Worker lifecycle persistence (`pending` → `processing` → `completed` / `failed`)
- [x] Socket.IO realtime events
- [x] Graceful shutdown (DB, Redis, workers)
- [x] Environment validation layer
- [x] Firebase token verification middleware (`AUTH_ENABLED` flag)
- [x] User model + `users` collection (`firebaseUid` unique, `email` sparse unique)
- [x] Lazy user upsert from Firebase claims (no sync endpoint)
- [x] Free plan usage tracking (`usage.assignmentsGenerated`)
- [x] 3-generation free limit enforced against completed + pending + processing (`plan-eligibility.service.ts`)
- [x] Usage increments only after successful completed generation
- [x] `GET /api/users/me` plan + usage + limits API
- [x] Assignment ownership (`userId` on assignments) + per-user scoped queries
- [x] Socket.IO auth (Firebase token) + per-user room isolation (`user:{uid}`)
- [x] Health check with MongoDB/Redis/queue/worker readiness + AI config visibility (`GET /api/health`: `aiProvider`, `aiModel`, `aiTimeoutMs`)
- [x] IP rate limiting on assignment creation (10/hour)
- [x] Answer key generation, validation, and persistence
- [x] Heroku deployment support (Procfile, Node engines, deployment guide)
- [x] **Subscription Architecture (Phase 1A)** — user `subscription` schema, `PLAN_CONFIG`, plan eligibility helpers, billing APIs

## Completed — Frontend

- [x] Next.js App Router + TypeScript foundation
- [x] Axios client + Zustand assignment store
- [x] Shared assignment types aligned with backend
- [x] Assignment creation flow (multi-step wizard)
- [x] Dashboard, workspace, and assignment detail views
- [x] Reusable `AssignmentCard` and `AssignmentList` components
- [x] Frontend ↔ backend integration (create + list + realtime)
- [x] PDF export (client-side html2canvas + jsPDF)
- [x] Responsive shell (desktop sidebar, mobile bottom nav)
- [x] ExamForge AI branding across UI and metadata
- [x] Firebase Google Sign-In (client SDK + Zustand auth store)
- [x] Auth-on-action guard (`useRequireAuth`) + Axios bearer interceptor
- [x] Guest dashboard with marketing CTA
- [x] `PlanBadge` component + sidebar plan/usage display
- [x] Free-plan usage fetch (`GET /users/me`) + upgrade modal on limit
- [x] **Subscription Architecture (Phase 1A)** — `/upgrade` page, billing types/API client, sidebar plan + subscription display

## Subscription Architecture (Phase 1A Complete)

- User schema extended with `subscription` (status, provider, dates, provider id)
- `PLAN_CONFIG` centralizes limits, pricing metadata, and feature flags
- `GET /api/billing/plans` and `GET /api/billing/current-plan`
- Plan eligibility: `canGenerateAssignments`, `canExportPdf`, `canUseFeature`
- Frontend `/upgrade` with Coming Soon CTAs; sidebar Upgrade navigation
- All users remain on **free** / **inactive** — no payment providers wired

## Architecture Summary

```
frontend/          ExamForge AI dashboard → REST API
backend/           Express API → MongoDB
                   BullMQ worker → AI provider (Groq/Gemini) → MongoDB
                   Redis (queue backing store)
```

**Flow:** User creates assignment → API saves document → BullMQ job enqueued → worker generates structured JSON via configured AI provider → validated output saved to `generatedPaper`.

## Technologies Used

| Layer | Stack |
|-------|-------|
| Frontend | Next.js, TypeScript, TailwindCSS, Zustand, Axios, react-hot-toast |
| Backend | Express, TypeScript, Mongoose, BullMQ, ioredis, Zod |
| AI | Google Gemini (default) or Groq via provider abstraction |
| Data | MongoDB, Redis (Upstash) |

## Pending / Future

- [ ] Billing / payments (Stripe or Razorpay) + checkout + webhooks (Phase 1B+)
- [ ] Subscription activation and plan upgrades via payment providers
- [ ] Monthly usage resets for paid tiers
- [ ] Production worker process separation (separate dyno/process)
- [ ] Socket.IO Redis adapter for multi-instance scaling
- [ ] Library, Groups, Settings, global search, notifications (Coming Soon stubs)
- [ ] Per-user rate limiting (currently IP-based only)

## Known Improvements Planned

- Extract assignment service layer (thin controllers, testable business logic)
- Centralized API error responses
- Automated test coverage
