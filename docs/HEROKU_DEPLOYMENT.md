# Heroku Deployment — ExamForge AI Backend

This guide deploys the **backend** from the `vedaAI_prototype` monorepo to Heroku as a **single web dyno**. The web process runs Express, Socket.IO, and the BullMQ assignment worker in one Node process — the same architecture used locally and on Render.

---

## Prerequisites

- [Heroku account](https://signup.heroku.com/)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) (optional but useful)
- GitHub repository access for Heroku GitHub integration
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- [Upstash Redis](https://upstash.com) database (recommended; code is tuned for Upstash quotas)
- Firebase project with a service account (when `AUTH_ENABLED=true`)

---

## Monorepo deployment setup

The repository root contains a minimal `package.json` (frontend dependency only). The backend lives in `backend/`. Heroku must use `backend/` as the application root.

### Option A — Monorepo buildpack (recommended for GitHub deploys)

1. Create a Heroku app (Dashboard or CLI).
2. Connect the GitHub repository under **Deploy → GitHub**.
3. Under **Settings → Buildpacks**, add buildpacks **in this order**:

   | Order | Buildpack URL |
   |-------|---------------|
   | 1 | `https://github.com/lstoll/heroku-buildpack-monorepo` |
   | 2 | `heroku/nodejs` |

4. Under **Settings → Config Vars**, add:

   ```
   APP_BASE=backend
   ```

5. The monorepo buildpack copies `backend/` to the slug root; Heroku then runs `npm install`, `npm run build`, and `npm start` from that directory.

### Option B — Deploy only the backend subtree

If you maintain a separate Git remote or CI job that pushes only `backend/`, you can use the standard `heroku/nodejs` buildpack without `APP_BASE`. The app root must contain `backend/package.json`, `Procfile`, and `tsconfig.json`.

---

## GitHub integration setup

1. In the Heroku Dashboard, open your app → **Deploy**.
2. Under **Deployment method**, select **GitHub**.
3. Connect your GitHub account and search for `vedaAI_prototype` (or your fork).
4. Enable **Automatic deploys** from `main` (optional) or use **Manual deploy**.
5. Confirm buildpack order and `APP_BASE=backend` (Option A above).
6. Deploy the branch.

After deploy, open **More → View logs** to confirm:

```
[SERVER] ExamForge AI backend started
[REDIS] Connected successfully
[SERVER] MongoDB connected successfully
[WORKER] Assignment worker ready
```

---

## Build and start commands

Heroku does not need custom build/start overrides when using the Node.js buildpack and `backend/` as app root.

| Phase | Command | Defined in |
|-------|---------|------------|
| **Install** | `npm install` | Heroku Node buildpack (automatic) |
| **Build** | `npm run build` → `tsc` | `backend/package.json` `build` script |
| **Start** | `npm start` → `node dist/server.js` | `backend/package.json` `start` script |
| **Process** | `web: npm start` | `backend/Procfile` |

TypeScript compiles `src/server.ts` to **`dist/server.js`**. That entry boots Express, Socket.IO, and the BullMQ worker together.

Node version is pinned in `backend/package.json`:

```json
"engines": { "node": "20.x", "npm": "10.x" }
```

---

## Required Heroku config vars

Set these under **Settings → Config Vars**. Heroku injects `PORT` and `NODE_ENV=production` automatically — do not override `PORT`.

### Always required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/examforge` |
| `REDIS_URL` | Redis URL (TLS for Upstash) | `rediss://default:token@host.upstash.io:6379` |
| `GEMINI_API_KEY` | Google Gemini API key (default provider) | `AIza...` |
| `CLIENT_URL` | Frontend origin(s) for CORS and Socket.IO; comma-separated for multiple | `https://www.examforge.me` |

Use `GROQ_API_KEY` instead of `GEMINI_API_KEY` when `AI_PROVIDER=groq`.

### Production authentication (required for ExamForge AI)

| Variable | Description |
|----------|-------------|
| `AUTH_ENABLED` | `true` |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | PEM private key with newlines escaped as `\n` |

**Firebase private key on Heroku:** paste the key as a single line, replacing real newlines with `\n`:

```
-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----
```

### Optional

| Variable | Default | Notes |
|----------|---------|-------|
| `AI_PROVIDER` | `gemini` | `gemini` or `groq` |
| `GROQ_API_KEY` | — | Required when `AI_PROVIDER=groq` |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model name |

### Monorepo only

| Variable | Value |
|----------|-------|
| `APP_BASE` | `backend` |

---

## MongoDB Atlas setup

1. Create a cluster (M0 free tier is fine for demos).
2. **Database Access** → create a database user with read/write on your database.
3. **Network Access** → allow access:
   - **Production:** `0.0.0.0/0` (required for Heroku dynos with rotating IPs), or use Atlas **Private Endpoints** on paid Heroku/network plans.
4. **Connect** → Drivers → copy the connection string.
5. Replace `<password>` and set the database name in the path if needed.
6. Set `MONGODB_URI` on Heroku.

Verify from logs after deploy: `[SERVER] MongoDB connected successfully`.

---

## Upstash Redis setup

1. Create a Redis database in the [Upstash Console](https://console.upstash.com/).
2. Copy the **Redis URL** (`rediss://...` — TLS enabled).
3. Set `REDIS_URL` on Heroku.

The backend detects Upstash URLs and applies connection timeouts and idle worker pausing to reduce command usage. If the Upstash quota is exceeded, the worker stops gracefully and logs `[REDIS] Request quota exceeded`.

**Alternative:** Heroku Redis add-on sets `REDIS_URL` automatically. The app reads `REDIS_URL` — no code change required. Upstash-specific optimizations apply only when the hostname contains `upstash.io`.

---

## Firebase Admin setup

1. Firebase Console → **Project settings** → **Service accounts**.
2. **Generate new private key** → download JSON.
3. Map JSON fields to Heroku config vars:

   | JSON field | Config var |
   |------------|------------|
   | `project_id` | `FIREBASE_PROJECT_ID` |
   | `client_email` | `FIREBASE_CLIENT_EMAIL` |
   | `private_key` | `FIREBASE_PRIVATE_KEY` (escape newlines as `\n`) |

4. Set `AUTH_ENABLED=true`.

5. **Authentication** → **Settings** → **Authorized domains** — add your production frontend host (e.g. `examforge.me`, `www.examforge.me`, and your Vercel preview domain if needed).

---

## Frontend configuration

Point the Vercel (or other) frontend at the Heroku app URL:

| Frontend variable | Value |
|-------------------|-------|
| `NEXT_PUBLIC_API_URL` | `https://<your-app>.herokuapp.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://<your-app>.herokuapp.com` |

Use `https` and `wss` in production.

---

## Health check

After deploy:

```bash
curl https://<your-app>.herokuapp.com/api/health
```

Expect `200` with `mongodb: connected`, `redis: connected`, and `worker` state when healthy.

---

## Scaling notes (current architecture)

- **One web dyno** is the supported setup. Express, Socket.IO, and the BullMQ worker run in that single process.
- Do **not** scale web dynos beyond one without adding a Socket.IO Redis adapter (not included in this deployment).
- A separate **worker dyno** is not configured; splitting the worker requires additional entry points and is out of scope for this setup.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Build fails immediately | `APP_BASE` missing or wrong buildpack order |
| `Missing required environment variable: MONGODB_URI` | Config var not set |
| CORS errors from frontend | `CLIENT_URL` wrong or missing |
| `401` on API / socket disconnect | Firebase vars wrong or `AUTH_ENABLED` mismatch |
| `H12 Request timeout` on assignment create | Large PDF parse in request path; retry with smaller file |
| Redis quota errors | Upstash plan limit; upgrade or reduce idle polling (already optimized) |
| Mongo connection timeout | Atlas network access blocking Heroku |

---

## Rollback

1. **Heroku releases:** Dashboard → **Activity** → select a previous release → **Rollback to here**.
2. **Git:** revert the deployment commit on `main` and redeploy, or push a known-good branch via manual deploy.
3. **Config vars:** document current values before changes; restore from backup if a bad deploy was config-related.

---

## Related files

| File | Purpose |
|------|---------|
| `backend/Procfile` | Declares `web: npm start` |
| `backend/package.json` | `engines`, `build`, `start` scripts |
| `backend/tsconfig.json` | Output `dist/server.js` |
| `backend/.env.example` | Local env template (do not commit `.env`) |
