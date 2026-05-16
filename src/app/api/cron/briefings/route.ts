import { NextResponse } from "next/server";

import { INGESTION_AGENTS } from "@/lib/firestore-types";
import type { BriefingRecord } from "@/lib/firestore-types";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { captureException } from "@/lib/monitoring";
import {
  createBriefingProviderAdapter,
  selectRoleAwareBriefingArticles,
} from "@/lib/providers/briefing-provider";
import { finishAgentRun, startAgentRun } from "@/lib/repositories/agent-runs-repository";
import { getRecentAlerts } from "@/lib/repositories/alerts-repository";
import { getRecentArticlesByAgent } from "@/lib/repositories/articles-repository";
import { saveBriefing } from "@/lib/repositories/briefings-repository";
import { BRIEFING_ROLES } from "@/types/domain";

function readCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  return secret ? secret : null;
}

function isAuthorized(request: Request, cronSecret: string): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function readBriefingTimezone(): string {
  return process.env.BRIEFING_TIMEZONE?.trim() || "UTC";
}

function toDateInTimezone(value: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(value);
    const year = parts.find((part) => part.type === "year")?.value ?? "0000";
    const month = parts.find((part) => part.type === "month")?.value ?? "01";
    const day = parts.find((part) => part.type === "day")?.value ?? "01";
    return `${year}-${month}-${day}`;
  } catch {
    return formatDate(value);
  }
}

export async function GET(request: Request) {
  const cronSecret = readCronSecret();
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is required for cron routes." }, { status: 500 });
  }

  if (!isAuthorized(request, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const now = new Date();
  const briefingTimezone = readBriefingTimezone();
  const briefingDate = toDateInTimezone(now, briefingTimezone);
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [articleBatches, alerts] = await Promise.all([
    Promise.all(
      INGESTION_AGENTS.map(async (agent) => ({
        agent,
        articles: await getRecentArticlesByAgent(agent, since, 30),
      })),
    ),
    getRecentAlerts(since, 50),
  ]);

  const allArticles = articleBatches.flatMap((batch) => batch.articles);

  const provider = createBriefingProviderAdapter();
  const generated = await Promise.all(
    BRIEFING_ROLES.map(async (role) => {
      const selectedArticles = selectRoleAwareBriefingArticles({
        role,
        articles: allArticles,
      });
      const runId = await startAgentRun({
        runType: "briefing",
        provider: "briefing-provider",
        role,
        itemsFetched: selectedArticles.length,
      });

      try {
        const { document: briefingDocument, telemetry } = await provider.generate({
          role,
          date: briefingDate,
          articles: selectedArticles,
          alerts,
        });
        const qualityFlags = telemetry.qualityFlags ?? [];
        const hasWarningFlags = qualityFlags.length > 0;

        const briefingRecord: BriefingRecord = {
          id: `briefing-${role}-${briefingDocument.date}`,
          role: briefingDocument.role,
          date: briefingDocument.date,
          sections: briefingDocument.sections,
          sources: briefingDocument.sources,
          generatedAt: briefingDocument.generatedAt,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          telemetry,
        };

        const persisted = await saveBriefing(briefingRecord);
        if (runId) {
          const runErrors = persisted
            ? qualityFlags.map((flag) => `quality:${flag}`)
            : ["Briefing could not be persisted to Firestore."];
          await finishAgentRun(runId, {
            status: persisted ? (hasWarningFlags ? "partial_failure" : "success") : "partial_failure",
            itemsFetched: selectedArticles.length,
            errors: runErrors,
          });
        }

        return {
          role,
          persisted,
          selectedArticlesCount: selectedArticles.length,
          telemetry,
          qualityFlags,
          error: persisted ? null : "Briefing could not be persisted to Firestore.",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown briefing generation failure.";
        captureException(error, {
          route: "/api/cron/briefings",
          component: "cron-briefings-generate",
          details: { role, selectedArticles: selectedArticles.length },
        });
        if (runId) {
          await finishAgentRun(runId, {
            status: "failure",
            itemsFetched: selectedArticles.length,
            errors: [message],
          });
        }
        return {
          role,
          persisted: false,
          selectedArticlesCount: selectedArticles.length,
          telemetry: {
            provider: "fallback-mock" as const,
            errorMessage: message,
          },
          qualityFlags: ["generation-failed"],
          error: message,
        };
      }
    }),
  );

  const firestoreEnabled = Boolean(getFirestoreDb());
  const resultsWithErrors = generated.filter((item) => item.error);
  const fallbackResults = generated.filter((item) => item.telemetry.provider === "fallback-mock");
  const warningFlags = [
    !firestoreEnabled ? "firestore-disabled" : null,
    fallbackResults.length > 0 ? "fallback-provider-used" : null,
    resultsWithErrors.length > 0 ? "briefing-partial-failures" : null,
  ].filter((flag): flag is string => Boolean(flag));

  return NextResponse.json({
    status: "ok",
    roles: generated.map((item) => item.role),
    briefingTimezone,
    briefingDate,
    articlesConsidered: allArticles.length,
    alertsConsidered: alerts.length,
    firestoreEnabled,
    persisted: generated.every((item) => item.persisted),
    warningFlags,
    articlesByAgent: articleBatches.map((batch) => ({
      agent: batch.agent,
      count: batch.articles.length,
    })),
    results: generated.map((item) => ({
      role: item.role,
      persisted: item.persisted,
      selectedArticlesCount: item.selectedArticlesCount,
      provider: item.telemetry.provider,
      model: item.telemetry.model,
      latencyMs: item.telemetry.latencyMs,
      qualityFlags: item.qualityFlags,
      error: item.error,
    })),
  });
}
