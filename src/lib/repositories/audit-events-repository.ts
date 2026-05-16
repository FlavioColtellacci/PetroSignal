import { randomUUID } from "node:crypto";

import { getFirestoreDb } from "@/lib/firebase-admin";
import type { AuditEventRecord } from "@/lib/firestore-types";

const AUDIT_EVENTS_COLLECTION = "audit_events";

interface WriteAuditEventInput {
  userId: string;
  eventType: AuditEventRecord["eventType"];
  path: string;
  metadata?: AuditEventRecord["metadata"];
}

export async function writeAuditEvent(input: WriteAuditEventInput): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) {
    return false;
  }

  const now = new Date().toISOString();
  const record: AuditEventRecord = {
    id: `audit-${randomUUID()}`,
    userId: input.userId,
    eventType: input.eventType,
    path: input.path,
    metadata: input.metadata,
    createdAt: now,
  };
  await db.collection(AUDIT_EVENTS_COLLECTION).doc(record.id).set(record);
  return true;
}
