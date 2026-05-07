# PetroSignal

Phase 1 foundation for a petroleum intelligence terminal built with Next.js App Router.

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

## Cron placeholders

- `vercel.json` includes placeholders for:
  - `/api/cron/ingest`
  - `/api/cron/briefings`
- Both routes enforce `CRON_SECRET` via `Authorization: Bearer <CRON_SECRET>` and currently return mock-safe JSON.

## Validation commands

```bash
npm run lint
npm run build
```

## Phase 2 migration notes

1. Replace mock repositories with Firestore-backed repositories using the existing domain contracts (`BriefingDocument`, alerts, news, agent status).
2. Implement live ingestion workers behind `/api/cron/ingest` for sanctions, PDVSA, market, JV, and social signals with deduplication and scoring.
3. Implement daily MiniMax briefing generation behind `/api/cron/briefings` and persist generated briefing documents to Firestore without changing JSON shape.
4. Add outbound daily delivery (Resend) using stored briefings and role targeting.
5. Add pricing enforcement and Stripe-based subscription gating across Free/Professional/Enterprise experiences.
