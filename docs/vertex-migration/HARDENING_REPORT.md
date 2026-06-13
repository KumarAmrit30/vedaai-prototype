# Phase 7.1 & 7.2 Production Hardening Report

**Project:** ExamForge AI (`vedaAI_prototype/backend`)  
**Date:** 2026-06-11  
**Scope:** Retry resilience, Vertex observability, finish-reason safety, JSON repair, AI health probe, configuration wiring  
**Status:** Implemented locally — not deployed, not committed

---

## Summary

Production hardening for the Vertex AI migration path is complete. Groq and Gemini providers are unchanged in behavior. All existing tests pass, with five new tests covering retry backoff, HTTP 429 retryability, JSON repair, and the AI health endpoint.

| Area | Before | After |
|------|--------|-------|
| Max retry attempts | 2 | 4 |
| HTTP 429 handling | Non-retryable | Retryable with backoff |
| Retry delay | Fixed 1s | Exponential + jitter (cap 15s) |
| Token metrics | Not captured | `promptTokens`, `completionTokens`, `totalTokens`, `thoughtsTokens` |
| Finish reasons | Ignored | `STOP` OK; `MAX_TOKENS`/`SAFETY`/`RECITATION` throw typed errors |
| JSON parse failures | Immediate throw | `jsonrepair` fallback, then Zod validation |
| AI health | Config-only in `/api/health` | Live probe at `GET /api/health/ai` |
| Vertex tuning | Hardcoded defaults | `VERTEX_TOP_P`, `VERTEX_SECTION_DELAY_MS` env vars |

**Verification:** `npm run lint` clean, `npm test` — **74/74 passed**

---

## 1. Retry Improvements

**File:** `backend/src/services/ai/retry-ai-request.ts`

### Changes

- Removed `429` from `NON_RETRYABLE_HTTP_STATUSES`
- Added explicit `status === 429` → retryable (before message-pattern checks, so `"rate limit"` text no longer blocks 429 retries)
- Increased `MAX_ATTEMPTS` from `2` to `4` (up to 3 retries)
- Replaced fixed 1s delay with exponential backoff + jitter:

```
delayMs = min(1000 * 2^attempt, 15000) + random(0..500)
```

- Exported `computeRetryDelayMs()` and `MAX_ATTEMPTS` for testability
- Retry logs now include `delayMs`

### Tests

**File:** `backend/tests/ai/retry-ai-request.test.ts`

- HTTP 429 is retryable
- Backoff formula verified with mocked `Math.random`
- Up to 4 attempts exercised (503 → 429 → 503 → success)
- Non-retryable validation errors still fail on first attempt

---

## 2. Vertex Token Metrics

### Type extensions

| File | Change |
|------|--------|
| `backend/src/services/ai/interfaces/AIProvider.ts` | Added `ProviderTokenMetrics`; `ProviderGenerationResult` extends it |
| `backend/src/modules/assignment/assignment.types.ts` | Token fields on `GenerationMetrics` |
| `backend/src/services/ai/generation-metrics.ts` | Matching token fields on internal metrics type |

### Vertex extraction

**File:** `backend/src/services/ai/providers/VertexProvider.ts`

Reads `response.usageMetadata` from Vertex:

| Vertex field | Mapped to |
|--------------|-----------|
| `promptTokenCount` | `promptTokens` |
| `candidatesTokenCount` | `completionTokens` |
| `totalTokenCount` | `totalTokens` |
| `thoughtsTokenCount` | `thoughtsTokens` |

### Pipeline wiring

| File | Behavior |
|------|----------|
| `VertexProvider.ts` | Returns token metrics in `ProviderGenerationResult`; logs on successful generation |
| `ai.service.ts` | Aggregates tokens across blueprint sections; includes in `generationMetrics` and completion logs |
| `assignment.worker.ts` | Logs token metrics on successful job completion |

Groq and Gemini do not populate token fields (optional fields remain undefined).

---

## 3. Finish Reason Handling

**New file:** `backend/src/services/ai/vertex-generation-errors.ts`

| Finish reason | Error class | Behavior |
|---------------|-------------|----------|
| `STOP` | — | Normal completion |
| `MAX_TOKENS` | `VertexGenerationTruncatedError` | Throws before returning partial JSON |
| `SAFETY` | `VertexGenerationBlockedError` | Throws with `finishReason: "SAFETY"` |
| `RECITATION` | `VertexGenerationBlockedError` | Throws with `finishReason: "RECITATION"` |

`VertexProvider.processVertexResponse()` inspects `candidate.finishReason` before text extraction. Truncation/blocked errors are non-retryable via message patterns (`"generation truncated"`, `"generation blocked"`).

---

## 4. JSON Repair Fallback

**Dependency:** `jsonrepair@^3.13.2` added to `backend/package.json`

**File:** `backend/src/services/ai/response-parser.ts`

Parse flow:

1. `JSON.parse(cleanedText)`
2. On failure → `jsonrepair(cleanedText)` → `JSON.parse(repaired)`
3. On success → existing Zod `assignmentResponseSchema` validation (unchanged)

Logs:

- `[AI][PARSER] JSON repaired successfully` on repair success
- `[AI][PARSER] JSON parse and repair failed` when both strategies fail

### Tests

**File:** `backend/tests/parser/response-parser.test.ts`

- Trailing-comma JSON repaired and validated
- Unrepairable input still throws `Failed to parse AI response as JSON`

---

## 5. AI Health Endpoint

**Route:** `GET /api/health/ai`

| File | Role |
|------|------|
| `health.routes.ts` | Registers `/ai` sub-route |
| `health.controller.ts` | `getAIHealth()` — 200 when `ok`, 503 when unhealthy |
| `health.service.ts` | `collectAIHealthReport()` calls `getAIProvider().healthCheck()` |

**Response shape:**

```json
{
  "provider": "VERTEX",
  "model": "gemini-2.5-flash",
  "ok": true,
  "latencyMs": 842,
  "timestamp": "2026-06-11T12:00:00.000Z"
}
```

On failure, includes `error` and returns HTTP 503.

Existing `GET /api/health` is unchanged.

**Tests:** `backend/tests/health/ai-health.test.ts`

---

## 6. Configuration

**File:** `backend/src/config/env.ts`

| Variable | Default | Validation | Used by |
|----------|---------|------------|---------|
| `VERTEX_TOP_P` | `0.95` | `0`–`1` | `VertexProvider` `generationConfig.topP` |
| `VERTEX_SECTION_DELAY_MS` | `0` | `>= 0` | `ai.service.ts` blueprint section loop |

**File:** `backend/.env.example` — documented both variables.

`VERTEX_SECTION_DELAY_MS` applies between blueprint section API calls (not before the first section). Default `0` preserves prior timing.

---

## Files Changed

### Modified

- `backend/src/services/ai/retry-ai-request.ts`
- `backend/src/services/ai/interfaces/AIProvider.ts`
- `backend/src/services/ai/providers/VertexProvider.ts`
- `backend/src/services/ai/response-parser.ts`
- `backend/src/services/ai/generation-metrics.ts`
- `backend/src/services/ai.service.ts`
- `backend/src/modules/assignment/assignment.types.ts`
- `backend/src/modules/health/health.service.ts`
- `backend/src/modules/health/health.controller.ts`
- `backend/src/modules/health/health.routes.ts`
- `backend/src/config/env.ts`
- `backend/src/queues/assignment.worker.ts`
- `backend/src/server.ts`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/.env.example`
- `backend/tests/ai/retry-ai-request.test.ts`
- `backend/tests/parser/response-parser.test.ts`

### Created

- `backend/src/services/ai/vertex-generation-errors.ts`
- `backend/tests/health/ai-health.test.ts`
- `docs/vertex-migration/HARDENING_REPORT.md`

### Preserved (unchanged behavior)

- `GroqProvider.ts`
- `GeminiProvider.ts`
- `AIProviderFactory.ts`
- All non-hardening test suites

---

## Operational Notes

### Retry behavior under rate limits

With 429 now retryable and up to 4 attempts, a rate-limited request may wait up to ~26s total backoff (2000 + 4000 + 8000 ms base, plus jitter) before failing. This is intentional for transient Vertex quota spikes.

### Token metrics availability

Token counts appear in logs and `assignment.generationMetrics` only when `AI_PROVIDER=vertex`. Other providers leave token fields undefined.

### AI health probe cost

`GET /api/health/ai` performs a live `generateText("Reply with OK")` call. Use sparingly in production monitoring; prefer infra-level probes on `/api/health` for high-frequency checks.

### Recommended env for Vertex production

```env
AI_PROVIDER=vertex
GCP_PROJECT_ID=aarogya-vault-dev
VERTEX_LOCATION=asia-south1
VERTEX_MODEL=gemini-2.5-flash
VERTEX_MAX_OUTPUT_TOKENS=8192
VERTEX_TOP_P=0.95
VERTEX_SECTION_DELAY_MS=500
```

---

## Test Results

```
npm run lint   → pass
npm test       → 74/74 pass (was 69/69; +5 new tests)
```

---

## Not Done (per instructions)

- No deployment to Render or GCP
- No git commit
- No production cutover (`AI_PROVIDER` default remains `groq`)
