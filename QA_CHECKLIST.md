# ExamForge AI — Final QA Checklist

Use this checklist before submission or a live demo. Test locally first, then repeat against production (Vercel + Render).

---

## Assignments

- [ ] **Create** — Full flow: details → upload (optional) → generate → preview
- [ ] **Create without upload** — Skip upload step; generation still succeeds
- [ ] **Delete** — Single delete with undo toast; confirm persists after undo window
- [ ] **Bulk delete** — Multiple selection + delete with undo
- [ ] **Refresh** — Reload page; assignments list restores from API
- [ ] **Detail open** — Click card; detail page loads paper and metadata
- [ ] **Soft delete persistence** — Deleted assignment returns 404 on direct URL
- [ ] **Search / filter / sort** — Workspace filters behave correctly
- [ ] **Bulk mark completed** — Optimistic update rolls back on API failure

---

## Uploads

- [ ] **TXT** — Valid `.txt` file uploads and grounds generation
- [ ] **PDF** — Valid text-based PDF extracts and grounds generation
- [ ] **Invalid type** — `.docx` or other formats show clear error
- [ ] **Oversized file** — File > 10 MB rejected with message
- [ ] **Empty file** — Zero-byte file rejected
- [ ] **Multiple files** — Up to 3 files accepted
- [ ] **Remove file** — Remove button clears file before submit

---

## Realtime (Socket.IO)

- [ ] **Progress updates** — Generation shows `processing` status + progress
- [ ] **Completion** — Paper appears when worker finishes; toast on success
- [ ] **Failure** — Failed job shows error state + meaningful toast
- [ ] **Delete sync** — Delete in one tab removes from another open tab
- [ ] **Reconnect** — Stop/start backend or toggle network; reconnect toast appears and clears

---

## PDF Export

- [ ] **Desktop Chrome** — Download starts; filename is sanitized
- [ ] **Desktop Safari** — Same direct download (no print dialog)
- [ ] **Mobile Safari** — Export completes; file saves/opens
- [ ] **Mobile Chrome** — Export completes
- [ ] **Short assignment** — Single page; margins and text crisp
- [ ] **Long assignment** — Multi-page; no clipped sections or broken splits
- [ ] **Loading state** — Button shows spinner; duplicate clicks prevented
- [ ] **Error handling** — Failure shows “Unable to generate PDF” toast

---

## Responsive

- [ ] **Desktop (1280px+)** — Sidebar, topbar, content max-width
- [ ] **Tablet (768px)** — Collapsed sidebar / compact shell
- [ ] **Mobile (375px)** — Bottom nav, FAB spacing, no horizontal overflow
- [ ] **Assignment detail mobile** — Preview readable; sidebar not overlapping paper
- [ ] **Safe area** — Content not hidden behind iPhone home indicator
- [ ] **Create flow mobile** — Stepper, forms, upload dropzone usable

---

## Loading & Empty States

- [ ] **Dashboard skeleton** — Shows on first load; resolves to content or empty state
- [ ] **Dashboard error** — Network failure shows retry on home page
- [ ] **Assignments list error** — Failed fetch shows retry button
- [ ] **No assignments** — Empty state with create CTA
- [ ] **No recent activity** — Helpful placeholder on dashboard
- [ ] **No pending jobs** — Pending section empty state
- [ ] **Filtered empty** — Search/filter with no matches shows guidance

---

## Deployment

- [ ] **Vercel build** — `npm run build` passes in frontend
- [ ] **Render startup** — Backend starts with valid env vars
- [ ] **Production envs** — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `CLIENT_URL` set
- [ ] **API connectivity** — Frontend loads assignments from production API
- [ ] **CORS** — No cross-origin errors in browser console
- [ ] **Health check** — `GET /api/health` returns OK
- [ ] **Cold start** — Warm backend before demo if on Render free tier
- [ ] **End-to-end production** — Create → generate → export on live URLs

---

## Accessibility & UX (spot check)

- [ ] **Keyboard** — Primary buttons focusable; dropzone activates with Enter/Space
- [ ] **Disabled states** — Submit/export disabled while loading
- [ ] **Toast readability** — Errors use clear, action-oriented copy
- [ ] **404 detail** — Deleted/missing assignment shows helpful message

---

## Sign-off

| Tester | Date | Environment | Pass |
|--------|------|-------------|------|
| | | Local | ☐ |
| | | Production | ☐ |
