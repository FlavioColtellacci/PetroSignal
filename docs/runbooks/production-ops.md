# PetroSignal Production Ops Runbook

## 1) Missing Firestore index

Symptoms:
- API responses fail with Firestore index errors.
- Logs include a Firestore index creation URL.

Actions:
1. Open the index creation URL from logs.
2. Add the same index to `firebase/firestore.indexes.json`.
3. Deploy indexes:
   - `firebase deploy --only firestore:indexes`
4. Re-run affected API or cron route.

## 2) Provider key failures (Brave, Serper, MiniMax)

Symptoms:
- Cron responses include warning flags (`provider-partial-failures`, `fallback-provider-used`).
- Agent runs show provider errors in `agent_runs.errors`.

Actions:
1. Check environment variables in deployment target:
   - `BRAVE_API_KEY`
   - `SERPER_API_KEY`
   - `MINIMAX_API_KEY`
2. Validate key quota/status in provider consoles.
3. Trigger manual smoke test after correction.

## 3) Firestore disabled in production

Symptoms:
- Cron JSON includes `firestoreEnabled: false`.
- Read APIs stay in `x-petrosignal-runtime-mode: fallback-mock`.

Actions:
1. Confirm Firebase Admin env vars are set in deployment:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
2. Ensure project ID is production (`petrosignal-prod`) and credentials match.
3. Redeploy and verify runtime header switches to `live-firestore`.

## 4) Manual cron smoke tests

Prerequisites:
- `CRON_SECRET` available in shell.
- Dev server or deployed URL reachable.

Commands:
- `curl -sS -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/ingest`
- `curl -sS -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/briefings`

Success checks:
- `status: "ok"`
- No critical warning flags
- Expected `providerItemsByAgent` / `results` payload

## 5) Alert thresholds

- `cron-missed`: no successful run in expected schedule period.
- `fallback-rate-high`: fallback provider used in more than 30% of last 20 cron runs.
- `firestore-disabled-prod`: any production cron response with `firestoreEnabled=false`.
