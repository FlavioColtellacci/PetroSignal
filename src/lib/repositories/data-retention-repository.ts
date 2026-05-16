import { getFirestoreDb } from "@/lib/firebase-admin";

type RetentionTarget = {
  collection: string;
  dateField: string;
  envKey: string;
  defaultDays: number;
};

const RETENTION_TARGETS: RetentionTarget[] = [
  { collection: "articles", dateField: "publishedAt", envKey: "RETENTION_ARTICLES_DAYS", defaultDays: 90 },
  { collection: "alerts", dateField: "timestamp", envKey: "RETENTION_ALERTS_DAYS", defaultDays: 120 },
  { collection: "briefings", dateField: "generatedAt", envKey: "RETENTION_BRIEFINGS_DAYS", defaultDays: 180 },
  { collection: "agent_runs", dateField: "startedAt", envKey: "RETENTION_AGENT_RUNS_DAYS", defaultDays: 30 },
  { collection: "audit_events", dateField: "createdAt", envKey: "RETENTION_AUDIT_EVENTS_DAYS", defaultDays: 365 },
];

export interface RetentionPurgeResult {
  collection: string;
  dateField: string;
  days: number;
  deleted: number;
}

function readRetentionDays(envKey: string, defaultDays: number): number {
  const rawValue = process.env[envKey]?.trim();
  if (!rawValue) {
    return defaultDays;
  }
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) {
    return defaultDays;
  }
  return parsed;
}

async function deleteCollectionBeforeDate(
  collection: string,
  dateField: string,
  cutoffIso: string,
  batchSize: number,
): Promise<number> {
  const db = getFirestoreDb();
  if (!db) {
    return 0;
  }

  let deleted = 0;
  while (true) {
    const snapshot = await db
      .collection(collection)
      .where(dateField, "<", cutoffIso)
      .orderBy(dateField, "asc")
      .limit(batchSize)
      .get();

    if (snapshot.empty) {
      return deleted;
    }

    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deleted += snapshot.docs.length;
  }
}

export async function runRetentionPurge(now = new Date()): Promise<RetentionPurgeResult[]> {
  const results: RetentionPurgeResult[] = [];
  for (const target of RETENTION_TARGETS) {
    const days = readRetentionDays(target.envKey, target.defaultDays);
    if (days <= 0) {
      results.push({
        collection: target.collection,
        dateField: target.dateField,
        days,
        deleted: 0,
      });
      continue;
    }

    const cutoffIso = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    const deleted = await deleteCollectionBeforeDate(target.collection, target.dateField, cutoffIso, 200);
    results.push({
      collection: target.collection,
      dateField: target.dateField,
      days,
      deleted,
    });
  }
  return results;
}
