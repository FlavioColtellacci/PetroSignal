import { NextResponse } from "next/server";

import { requireAuthenticatedRequest } from "@/lib/api-auth";
import { getRecentAgentRuns } from "@/lib/repositories/agent-runs-repository";
import type { AgentRunRecord, IngestionAgent } from "@/lib/firestore-types";
import { captureException } from "@/lib/monitoring";
import { AGENT_NAMES, type AgentName, type AgentStatus } from "@/types/domain";

const AGENT_NAME_BY_INGESTION_AGENT: Record<IngestionAgent, AgentName> = {
  sanctions: "Sanctions Agent",
  pdvsa: "PDVSA Agent",
  market: "Market Agent",
  jv_tracker: "JV Tracker",
  social: "Social Agent",
};

const INGESTION_AGENT_BY_AGENT_NAME: Record<AgentName, IngestionAgent> = {
  "Sanctions Agent": "sanctions",
  "PDVSA Agent": "pdvsa",
  "Market Agent": "market",
  "JV Tracker": "jv_tracker",
  "Social Agent": "social",
};

function toHealth(run: AgentRunRecord | null): AgentStatus["health"] {
  if (!run) return "offline";
  if (run.status === "started") return "processing";
  if (run.status === "failure" || run.status === "partial_failure") return "degraded";
  if (!run.finishedAt) return "processing";

  const completedAtMs = Date.parse(run.finishedAt);
  if (Number.isNaN(completedAtMs)) return "degraded";

  const staleMs = 12 * 60 * 60 * 1000;
  return Date.now() - completedAtMs > staleMs ? "degraded" : "online";
}

function toNote(run: AgentRunRecord | null): string {
  if (!run) return "No telemetry runs recorded yet.";
  if (run.status === "started") return "Ingestion run in progress.";
  if (run.status === "success") {
    return `Last run completed successfully (${run.itemsFetched} items fetched).`;
  }
  const errorHint = run.errors[0] ? ` ${run.errors[0]}` : "";
  return `Last run reported issues.${errorHint}`;
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const runs = await getRecentAgentRuns();
    const latestByIngestionAgent = new Map<IngestionAgent, AgentRunRecord>();
    for (const run of runs) {
      if (run.runType !== "ingest" || !run.agent) {
        continue;
      }
      if (!latestByIngestionAgent.has(run.agent)) {
        latestByIngestionAgent.set(run.agent, run);
      }
      if (latestByIngestionAgent.size === AGENT_NAMES.length) {
        break;
      }
    }

    const status: AgentStatus[] = AGENT_NAMES.map((name) => {
      const ingestionAgent = INGESTION_AGENT_BY_AGENT_NAME[name];
      const run = latestByIngestionAgent.get(ingestionAgent) ?? null;
      return {
        name: AGENT_NAME_BY_INGESTION_AGENT[ingestionAgent],
        health: toHealth(run),
        lastCheckAt: run?.finishedAt ?? run?.startedAt ?? new Date(0).toISOString(),
        note: toNote(run),
      };
    });

    return NextResponse.json(status, {
      headers: { "x-petrosignal-runtime-mode": "live-firestore" },
    });
  } catch (error) {
    captureException(error, {
      route: "/api/agents/status",
      component: "agents-status-route",
    });
    return NextResponse.json(
      AGENT_NAMES.map((name) => ({
        name,
        health: "offline" as const,
        lastCheckAt: new Date(0).toISOString(),
        note: "Agent status unavailable (telemetry read failure).",
      })),
      {
        headers: { "x-petrosignal-runtime-mode": "fallback-mock" },
      },
    );
  }
}
