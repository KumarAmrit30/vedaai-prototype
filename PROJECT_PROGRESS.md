# ExamForge AI — Project Progress

**Last updated:** June 2026  
**Repository:** [vedaai-prototype](https://github.com/KumarAmrit30/vedaai-prototype)

## Completed — Backend

- [x] Express + TypeScript bootstrap (CommonJS)
- [x] Modular API structure (routes, controllers, middleware)
- [x] MongoDB connection via Mongoose
- [x] Redis client (Upstash-compatible `rediss://`)
- [x] BullMQ queue + worker for assignment generation
- [x] Pluggable AI providers (Groq default, Gemini optional)
- [x] AI prompt builder + Zod response parser
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
- [x] 3-generation free limit (403 over limit, increment only on success)
- [x] `GET /api/users/me` plan + usage + limits API

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
| AI | Groq (default) or Google Gemini via provider abstraction |
| Data | MongoDB, Redis (Upstash) |

## Pending / Future

- [ ] Request validation (Zod on API + react-hook-form on frontend)
- [ ] Health check with DB/Redis readiness
- [ ] Production worker process separation
- [ ] Billing / payments (Stripe or Razorpay) + paid plan activation
- [ ] Assignment ownership (`userId` on assignments) + per-user queries
- [ ] Socket room isolation per user
- [ ] Subscription management + monthly usage resets

## Known Improvements Planned

- Extract assignment service layer (thin controllers, testable business logic)
- Centralized API error responses
- UI polish for stub navigation items (Groups, Library, Settings)
- Automated test coverage
