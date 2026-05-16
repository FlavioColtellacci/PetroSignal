# Security and API Access Audit

## Route protection status

- Public routes: `/`, `/login`, `/privacy`, `/terms`, `/pricing`
- Auth-required app routes: `/dashboard`, `/alerts`, `/news`, `/settings`
- Protected API routes via middleware + handler verification:
  - `/api/news`
  - `/api/alerts`
  - `/api/metrics`
  - `/api/briefing/*`
  - `/api/agents/status`
  - `/api/preferences`

## Cron/admin protection

- `/api/cron/ingest` and `/api/cron/briefings` require `Authorization: Bearer <CRON_SECRET>`.
- Unauthorized cron requests return `401`.
- Missing `CRON_SECRET` returns `500` to prevent unsafe execution.

## Rate limiting

- Implemented per-authenticated-user limits on:
  - `/api/news`
  - `/api/alerts`
  - `/api/metrics`
  - `/api/briefing/*` (read/history/export)
- Exceeded limits return `429` with `retry-after`.

## Monitoring and abuse detection

- Sentry exception capture integrated for cron, provider adapters, and key read APIs.
- Runtime warning flags indicate operational risk (`firestore-disabled`, fallback/provider partial failures).
