import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { INGESTION_AGENTS, type AlertRecord, type ArticleRecord, type IngestionAgent } from "@/lib/firestore-types";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { captureException } from "@/lib/monitoring";
import { createSanctionsProviderAdapter } from "@/lib/providers/sanctions-provider";
import { finishAgentRun, startAgentRun } from "@/lib/repositories/agent-runs-repository";
import { getArticleByCanonicalUrlHash, writeArticles } from "@/lib/repositories/articles-repository";
import { writeAlerts } from "@/lib/repositories/alerts-repository";

type AlertSignalRule = {
  signal: string;
  keywords: string[];
  weight: number;
};

const GLOBAL_ALERT_RULES: AlertSignalRule[] = [
  {
    signal: "supply-disruption",
    keywords: ["export halt", "supply disruption", "force majeure", "terminal outage"],
    weight: 3,
  },
  {
    signal: "operational-shutdown",
    keywords: ["shutdown", "production halt", "maintenance stop", "offline"],
    weight: 2,
  },
  {
    signal: "labor-risk",
    keywords: ["strike", "walkout", "labor dispute", "union action"],
    weight: 2,
  },
];

const AGENT_ALERT_RULES: Record<IngestionAgent, AlertSignalRule[]> = {
  sanctions: [
    { signal: "ofac-action", keywords: ["ofac", "sdn", "blocked"], weight: 5 },
    { signal: "sanctions-enforcement", keywords: ["sanction", "asset freeze", "penalty"], weight: 4 },
    { signal: "license-risk", keywords: ["license revoked", "general license", "enforcement"], weight: 3 },
  ],
  pdvsa: [
    { signal: "pdvsa-production", keywords: ["pdvsa production", "output", "upgrader"], weight: 3 },
    { signal: "pdvsa-governance", keywords: ["board change", "leadership change", "state-owned"], weight: 2 },
    { signal: "pdvsa-export-shock", keywords: ["cargo delay", "tanker queue", "lifting program"], weight: 3 },
  ],
  market: [
    { signal: "price-volatility", keywords: ["brent", "wti", "price spike", "price slump"], weight: 3 },
    { signal: "demand-shift", keywords: ["demand decline", "refining margin", "inventory draw"], weight: 2 },
    { signal: "macro-shock", keywords: ["opec", "fed", "inflation", "recession"], weight: 2 },
  ],
  jv_tracker: [
    { signal: "jv-contract-risk", keywords: ["joint venture", "contract dispute", "arbitration"], weight: 3 },
    { signal: "partner-movement", keywords: ["partner exit", "stake sale", "equity transfer"], weight: 3 },
    { signal: "project-delay", keywords: ["delay", "deadline slipped", "construction pause"], weight: 2 },
  ],
  social: [
    { signal: "social-escalation", keywords: ["protest", "unrest", "roadblock", "demonstration"], weight: 3 },
    { signal: "community-safety", keywords: ["injury", "fatality", "incident", "security breach"], weight: 3 },
    { signal: "policy-pressure", keywords: ["regulator warning", "public pressure", "civil society"], weight: 2 },
  ],
};

const AGENT_ALERT_BONUS: Record<string, number> = {
  sanctions: 2,
  pdvsa: 1,
  market: 1,
  jv_tracker: 1,
  social: 0,
};

function readCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  return secret ? secret : null;
}

function isAuthorized(request: Request, cronSecret: string): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

function canonicalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.search = "";
  return parsed.toString().replace(/\/$/, "");
}

function toCanonicalUrlHash(canonicalUrl: string): string {
  return createHash("sha256").update(canonicalUrl).digest("hex");
}

function buildArticleId(canonicalUrlHash: string): string {
  return `article-${canonicalUrlHash.slice(0, 16)}`;
}

function buildAlertId(articleId: string): string {
  return `alert-${articleId}`;
}

function computeAlertScore(item: {
  title: string;
  summary: string;
  agent: IngestionAgent;
}): { score: number; matchedSignals: string[] } {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();
  const candidateRules = [...GLOBAL_ALERT_RULES, ...(AGENT_ALERT_RULES[item.agent] ?? [])];
  const matchedSignals: string[] = [];
  const keywordScore = candidateRules.reduce((total, rule) => {
    const hit = rule.keywords.some((keyword) => haystack.includes(keyword));
    if (hit) {
      matchedSignals.push(rule.signal);
      return total + rule.weight;
    }
    return total;
  }, 0);
  return {
    score: keywordScore + (AGENT_ALERT_BONUS[item.agent] ?? 0),
    matchedSignals,
  };
}

function toAlertSeverity(score: number): AlertRecord["severity"] | null {
  if (score >= 8) return "high";
  if (score >= 5) return "medium";
  if (score >= 3) return "low";
  return null;
}

export async function GET(request: Request) {
  const cronSecret = readCronSecret();
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is required for cron routes." }, { status: 500 });
  }

  if (!isAuthorized(request, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const provider = createSanctionsProviderAdapter();
  const providerItemGroups = await Promise.all(
    INGESTION_AGENTS.map(async (agent) => {
      const runId = await startAgentRun({
        runType: "ingest",
        provider: "sanctions-provider",
        agent,
      });

      try {
        const items = await provider.fetchLatest(agent);
        if (runId) {
          await finishAgentRun(runId, {
            status: "success",
            itemsFetched: items.length,
            errors: [],
          });
        }
        return {
          agent,
          items,
          error: null as string | null,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown ingestion failure.";
        captureException(error, {
          route: "/api/cron/ingest",
          component: "cron-ingest-provider-fetch",
          details: { agent },
        });
        if (runId) {
          await finishAgentRun(runId, {
            status: "failure",
            itemsFetched: 0,
            errors: [message],
          });
        }
        return {
          agent,
          items: [] as Awaited<ReturnType<typeof provider.fetchLatest>>,
          error: message,
        };
      }
    }),
  );
  const providerItems = providerItemGroups.flatMap((group) => group.items);

  const articlesToWrite: ArticleRecord[] = [];
  const alertsToWrite: AlertRecord[] = [];
  const seenArticleSignatures = new Set<string>();
  let dedupedCount = 0;

  for (const item of providerItems) {
    const contentSignature = `${item.title.trim().toLowerCase()}::${item.outlet.trim().toLowerCase()}`;
    if (seenArticleSignatures.has(contentSignature)) {
      dedupedCount += 1;
      continue;
    }
    seenArticleSignatures.add(contentSignature);

    const canonicalUrl = canonicalizeUrl(item.url);
    const canonicalUrlHash = toCanonicalUrlHash(canonicalUrl);
    const existing = await getArticleByCanonicalUrlHash(canonicalUrlHash);
    if (existing) {
      dedupedCount += 1;
      continue;
    }

    const articleId = buildArticleId(canonicalUrlHash);
    const article: ArticleRecord = {
      id: articleId,
      agent: item.agent,
      headline: item.title,
      summary: item.summary,
      outlet: item.outlet,
      url: item.url,
      canonicalUrl,
      canonicalUrlHash,
      publishedAt: item.publishedAt,
      tags: item.tags,
      ingestedAt: new Date().toISOString(),
    };
    articlesToWrite.push(article);

    const { score: alertScore, matchedSignals } = computeAlertScore({
      title: item.title,
      summary: item.summary,
      agent: item.agent,
    });
    const severity = toAlertSeverity(alertScore);
    if (severity) {
      alertsToWrite.push({
        id: buildAlertId(articleId),
        agent: item.agent,
        title: `${item.agent.replace("_", " ")} signal: ${item.title}`,
        summary: item.summary,
        severity,
        score: alertScore,
        matchedSignals,
        timestamp: new Date().toISOString(),
        source: {
          url: item.url,
          title: item.title,
        },
        articleId,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const writtenArticles = await writeArticles(articlesToWrite);
  const writtenAlerts = await writeAlerts(alertsToWrite);
  const firestoreEnabled = Boolean(getFirestoreDb());
  const providerErrors = providerItemGroups.filter((group) => group.error).length;
  const warningFlags = [
    !firestoreEnabled ? "firestore-disabled" : null,
    providerErrors > 0 ? "provider-partial-failures" : null,
    writtenArticles === 0 && providerItems.length > 0 ? "no-new-articles-persisted" : null,
  ].filter((flag): flag is string => Boolean(flag));

  return NextResponse.json({
    status: "ok",
    providerItems: providerItems.length,
    providerItemsByAgent: providerItemGroups.map((group) => ({
      agent: group.agent,
      count: group.items.length,
      error: group.error,
    })),
    firestoreEnabled,
    insertedArticles: writtenArticles,
    insertedAlerts: writtenAlerts,
    dedupedItems: dedupedCount,
    warningFlags,
  });
}
