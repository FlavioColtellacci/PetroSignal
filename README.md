# PetroSignal

Petroleum intelligence terminal built with Next.js App Router. The codebase now ships the Phase 2 vertical slice: a sanctions ingestion pipeline and an investor briefing generator backed by Firestore, with provider adapters mock-implemented until external API keys are wired in.

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

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (preserve escaped newlines as `\n` in `.env.local`)

### Provider env vars (kept for upcoming live adapters)

- `MINIMAX_API_KEY`
- `MINIMAX_MODEL`
- `RESEND_API_KEY`
- `BRIEFING_FROM_EMAIL`

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
- Sanctions ingestion at `/api/cron/ingest`: provider adapter (mock), canonical-URL SHA-256 deduplication, batched Firestore writes, keyword-based high-priority alerts.
- Investor briefing generation at `/api/cron/briefings`: 24h sanctions article + alert window, briefing provider adapter (mock), Firestore persistence using the canonical `BriefingDocument` shape.
- Firestore-first read APIs with mock fallback: `/api/briefing/[role]`, `/api/alerts`, `/api/news`.

### Remaining for Phase 2

- Real provider adapters for Brave Search, Serper, and MiniMax (currently mock-backed).
- Remaining ingestion agents: PDVSA, market, JV tracker, social.
- Briefings for the four non-investor roles.
- Outbound delivery via Resend using stored briefings and role targeting.
- Pricing enforcement and Stripe-based subscription gating across Free/Professional/Enterprise.
