import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

import { getFirestoreDb } from "@/lib/firebase-admin";
import type { AlertRecord } from "@/lib/firestore-types";

const ALERTS_COLLECTION = "alerts";

function mapAlert(snapshot: QueryDocumentSnapshot): AlertRecord {
  const data = snapshot.data() as Omit<AlertRecord, "id">;
  return {
    id: snapshot.id,
    ...data,
  };
}

export async function writeAlerts(alerts: AlertRecord[]): Promise<number> {
  if (alerts.length === 0) {
    return 0;
  }

  const db = getFirestoreDb();
  if (!db) {
    return 0;
  }

  const batch = db.batch();
  for (const alert of alerts) {
    const ref = db.collection(ALERTS_COLLECTION).doc(alert.id);
    batch.set(ref, alert);
  }

  await batch.commit();
  return alerts.length;
}

export async function getRecentAlerts(sinceIso: string, limit = 50): Promise<AlertRecord[]> {
  const db = getFirestoreDb();
  if (!db) {
    return [];
  }

  const snapshot = await db
    .collection(ALERTS_COLLECTION)
    .where("timestamp", ">=", sinceIso)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(mapAlert);
}
