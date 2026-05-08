# PetroSignal

Petroleum intelligence terminal built with Next.js App Router. The codebase now ships the Phase 2 vertical slice: multi-agent ingestion and role-based briefing generation backed by Firestore, with safe mock fallback when provider keys are missing.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Safe dev workflow (recommended)

To keep RAM usage predictable on a 16GB machine:

- `npm run dev` now includes two protections:
  - blocks duplicate `next dev` processes for this repo
  - limits Node memory to 4GB (`NODE_OPTIONS=--max-old-space-size=4096`)
- If dev gets unstable or memory climbs unexpectedly:
  ```bash
  npm run dev:clean
  npm run dev
  ```
- For a one-command clean restart:
  ```bash
  npm run dev:fresh
  ```

This avoids the most common cause of runaway RAM: multiple Next.js dev servers and stale `.next` cache state.

## Available routes

- `/` landing overview
- `/dashboard` intelligence terminal
- `/alerts` alerts scaffold
- `/news` news scaffold
- `/settings` settings scaffold
- `/pricing` pricing scaffold

## Phase 2 runtime (Firestore + mock providers)

- `vercel.json` schedules:
  - `/api/cron/ingest`
  - `/api/cron/briefings`
- Both routes require `Authorization: Bearer <CRON_SECRET>`.
- In this slice, provider adapters are mock-backed by default (sanctions ingest + briefing generation), while persistence reads/writes are Firestore-backed when Firebase Admin credentials are present.
- If Firebase credentials are missing, read APIs gracefully fallback to in-memory mock data and cron routes report `firestoreEnabled: false`.

### Required env vars

- `CRON_SECRET`

### Firestore env vars (enable Firestore reads/writes)

- `FIREBASE_PROJECT_ID` — defaults to `petrosignal-dev` for the development project
- `FIREBASE_CLIENT_EMAIL` — service account email
- `FIREBASE_PRIVATE_KEY` — service account private key (preserve escaped newlines as `\n` in `.env.local`)

To populate `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`, generate a service account JSON from the [Firebase console](https://console.firebase.google.com/project/petrosignal-dev/settings/serviceaccounts/adminsdk) and copy the `client_email` and `private_key` fields into `.env.local`.

### Firebase Web SDK env vars (used for client-side Auth)

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

These are pre-populated in `.env.example` for the development project.

### Briefing provider env vars (MiniMax + fallback)

- `MINIMAX_API_KEY` — required for live MiniMax generation
- `MINIMAX_MODEL` — defaults to `MiniMax-M2.7-highspeed`
- `BRAVE_API_KEY` — optional, used first for ingestion search
- `SERPER_API_KEY` — optional, used if Brave is unavailable/empty
- `RESEND_API_KEY`
- `BRIEFING_FROM_EMAIL`

Investor briefing generation uses MiniMax via the Vercel AI SDK. If `MINIMAX_API_KEY` is unset or the MiniMax call fails after retries, cron falls back to the deterministic mock adapter and still persists the briefing to Firestore with telemetry tagged as `provider: "fallback-mock"`.

## Validation commands

```bash
npm run lint
npm run build
```

## Cron smoke test examples

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/ingest
curl -sS -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/briefings
```

## Phase 2 status

### Done in this slice

- Firebase Admin bootstrap with safe degradation when credentials are missing (`src/lib/firebase-admin.ts`).
- Firestore repositories for `articles`, `alerts`, and `briefings` (`src/lib/repositories/*`).
- Multi-agent ingestion at `/api/cron/ingest`: sanctions, PDVSA, market, JV tracker, and social agent paths with Brave/Serper providers (fallback to deterministic mock), canonical-URL SHA-256 deduplication, batched Firestore writes, and sanctions high-priority alerts.
- Multi-role briefing generation at `/api/cron/briefings`: 24h sanctions article + alert window, MiniMax generation via AI SDK for all briefing roles, deterministic source merging, and automatic typed mock fallback with provider telemetry persisted in Firestore.
- Firestore-first read APIs with mock fallback: `/api/briefing/[role]`, `/api/alerts`, `/api/news`.

### Remaining for Phase 2

- Outbound delivery via Resend using stored briefings and role targeting.
- Pricing enforcement and Stripe-based subscription gating across Free/Professional/Enterprise.
