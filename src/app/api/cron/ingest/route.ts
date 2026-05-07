import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import type { AlertRecord, ArticleRecord } from "@/lib/firestore-types";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { createSanctionsProviderAdapter } from "@/lib/providers/sanctions-provider";
import { getArticleByCanonicalUrlHash, writeArticles } from "@/lib/repositories/articles-repository";
import { writeAlerts } from "@/lib/repositories/alerts-repository";

const SANCTIONS_ALERT_KEYWORDS = ["sanction", "ofac", "blocked", "asset freeze", "compliance"];

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

function shouldCreateHighPriorityAlert(item: { title: string; summary: string }): boolean {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();
  return SANCTIONS_ALERT_KEYWORDS.some((keyword) => haystack.includes(keyword));
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
  const providerItems = await provider.fetchLatest();

  const articlesToWrite: ArticleRecord[] = [];
  const alertsToWrite: AlertRecord[] = [];
  let dedupedCount = 0;

  for (const item of providerItems) {
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
      agent: "sanctions",
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

    if (shouldCreateHighPriorityAlert(item)) {
      alertsToWrite.push({
        id: buildAlertId(articleId),
        title: `Sanctions signal: ${item.title}`,
        summary: item.summary,
        severity: "high",
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

  return NextResponse.json({
    status: "ok",
    providerItems: providerItems.length,
    firestoreEnabled: Boolean(getFirestoreDb()),
    insertedArticles: writtenArticles,
    insertedAlerts: writtenAlerts,
    dedupedItems: dedupedCount,
  });
}
