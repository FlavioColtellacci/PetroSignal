import { getFirestoreDb } from "@/lib/firebase-admin";
import type { BriefingShareRecord } from "@/lib/firestore-types";
import type { BriefingRole } from "@/types/domain";

const BRIEFING_SHARES_COLLECTION = "briefing_shares";

export async function createBriefingShare(input: {
  userId: string;
  role: BriefingRole;
  briefingId: string;
  expiresInHours?: number;
}): Promise<BriefingShareRecord | null> {
  const db = getFirestoreDb();
  if (!db) {
    return null;
  }

  const now = new Date();
  const expiresInHours = input.expiresInHours ?? 24;
  const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();
  const doc = db.collection(BRIEFING_SHARES_COLLECTION).doc();
  const payload: BriefingShareRecord = {
    id: doc.id,
    userId: input.userId,
    role: input.role,
    briefingId: input.briefingId,
    expiresAt,
    createdAt: now.toISOString(),
  };

  await doc.set(payload);
  return payload;
}

export async function getBriefingShareById(shareId: string): Promise<BriefingShareRecord | null> {
  const db = getFirestoreDb();
  if (!db) {
    return null;
  }
  const snapshot = await db.collection(BRIEFING_SHARES_COLLECTION).doc(shareId).get();
  if (!snapshot.exists) {
    return null;
  }
  const data = snapshot.data() as Omit<BriefingShareRecord, "id"> | undefined;
  if (!data) {
    return null;
  }
  return {
    id: snapshot.id,
    ...data,
  };
}
