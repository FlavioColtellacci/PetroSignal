import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

import { getFirestoreDb } from "@/lib/firebase-admin";
import type { AgentRunRecord, AgentRunStatus, AgentRunType, IngestionAgent } from "@/lib/firestore-types";
import type { BriefingRole } from "@/types/domain";

const AGENT_RUNS_COLLECTION = "agent_runs";

type StartAgentRunInput = {
  runType: AgentRunType;
  provider: string;
  status?: AgentRunStatus;
  startedAt?: string;
  agent?: IngestionAgent;
  role?: BriefingRole;
  itemsFetched?: number;
  errors?: string[];
};

type FinishAgentRunInput = {
  status: Exclude<AgentRunStatus, "started">;
  finishedAt?: string;
  itemsFetched?: number;
  errors?: string[];
};

function mapAgentRun(snapshot: QueryDocumentSnapshot): AgentRunRecord {
  const data = snapshot.data() as Omit<AgentRunRecord, "id">;
  return {
    id: snapshot.id,
    ...data,
  };
}

export async function startAgentRun(input: StartAgentRunInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const startedAt = input.startedAt ?? nowIso;
  const docRef = db.collection(AGENT_RUNS_COLLECTION).doc();
  const payload: AgentRunRecord = {
    id: docRef.id,
    runType: input.runType,
    provider: input.provider,
    status: input.status ?? "started",
    startedAt,
    itemsFetched: input.itemsFetched ?? 0,
    errors: input.errors ?? [],
    agent: input.agent,
    role: input.role,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await docRef.set(payload);
  return docRef.id;
}

export async function finishAgentRun(runId: string, input: FinishAgentRunInput): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) {
    return false;
  }

  const nowIso = new Date().toISOString();
  await db.collection(AGENT_RUNS_COLLECTION).doc(runId).set(
    {
      status: input.status,
      finishedAt: input.finishedAt ?? nowIso,
      itemsFetched: input.itemsFetched ?? 0,
      errors: input.errors ?? [],
      updatedAt: nowIso,
    },
    { merge: true },
  );
  return true;
}

export async function getRecentAgentRuns(limit = 200): Promise<AgentRunRecord[]> {
  const db = getFirestoreDb();
  if (!db) {
    return [];
  }

  const snapshot = await db
    .collection(AGENT_RUNS_COLLECTION)
    .orderBy("startedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(mapAgentRun);
}
