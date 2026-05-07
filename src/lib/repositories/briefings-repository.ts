import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

import { getFirestoreDb } from "@/lib/firebase-admin";
import type { BriefingRecord } from "@/lib/firestore-types";
import type { BriefingRole } from "@/types/domain";

const BRIEFINGS_COLLECTION = "briefings";

function mapBriefing(snapshot: QueryDocumentSnapshot): BriefingRecord {
  const data = snapshot.data() as Omit<BriefingRecord, "id">;
  return {
    id: snapshot.id,
    ...data,
  };
}

export async function saveBriefing(briefing: BriefingRecord): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) {
    return false;
  }

  await db.collection(BRIEFINGS_COLLECTION).doc(briefing.id).set(briefing);
  return true;
}

export async function getLatestBriefingByRole(role: BriefingRole): Promise<BriefingRecord | null> {
  const db = getFirestoreDb();
  if (!db) {
    return null;
  }

  const snapshot = await db
    .collection(BRIEFINGS_COLLECTION)
    .where("role", "==", role)
    .orderBy("generatedAt", "desc")
    .limit(1)
    .get();

  const doc = snapshot.docs[0];
  if (!doc) {
    return null;
  }

  return mapBriefing(doc);
}
