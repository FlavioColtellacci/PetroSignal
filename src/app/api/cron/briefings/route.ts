import { NextResponse } from "next/server";

import type { BriefingRecord } from "@/lib/firestore-types";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { createBriefingProviderAdapter } from "@/lib/providers/briefing-provider";
import { getRecentAlerts } from "@/lib/repositories/alerts-repository";
import { getRecentArticlesByAgent } from "@/lib/repositories/articles-repository";
import { saveBriefing } from "@/lib/repositories/briefings-repository";
import type { BriefingRole } from "@/types/domain";

const INVESTOR_ROLE: BriefingRole = "investor";

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

export async function GET(request: Request) {
  const cronSecret = readCronSecret();
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is required for cron routes." }, { status: 500 });
  }

  if (!isAuthorized(request, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [articles, alerts] = await Promise.all([
    getRecentArticlesByAgent("sanctions", since, 50),
    getRecentAlerts(since, 50),
  ]);

  const provider = createBriefingProviderAdapter();
  const briefingDocument = await provider.generate({
    role: INVESTOR_ROLE,
    date: formatDate(now),
    articles,
    alerts,
  });

  const briefingRecord: BriefingRecord = {
    id: `briefing-${INVESTOR_ROLE}-${briefingDocument.date}`,
    role: briefingDocument.role,
    date: briefingDocument.date,
    sections: briefingDocument.sections,
    sources: briefingDocument.sources,
    generatedAt: briefingDocument.generatedAt,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const persisted = await saveBriefing(briefingRecord);

  return NextResponse.json({
    status: "ok",
    role: INVESTOR_ROLE,
    articlesConsidered: articles.length,
    alertsConsidered: alerts.length,
    firestoreEnabled: Boolean(getFirestoreDb()),
    persisted,
  });
}
