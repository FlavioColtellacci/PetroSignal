import { NextResponse } from "next/server";

import { requireAuthenticatedRequest } from "@/lib/api-auth";
import { INGESTION_AGENTS } from "@/lib/firestore-types";
import { captureException } from "@/lib/monitoring";
import { consumeRateLimit } from "@/lib/rate-limit";
import { writeAuditEvent } from "@/lib/repositories/audit-events-repository";
import { getRecentArticlesByAgent } from "@/lib/repositories/articles-repository";
import { getMockNews } from "@/lib/mock-data";
import type { NewsItem } from "@/types/domain";

function mapArticleToNewsItem(article: Awaited<ReturnType<typeof getRecentArticlesByAgent>>[number]): NewsItem {
  return {
    id: article.id,
    headline: article.headline,
    summary: article.summary,
    publishedAt: article.publishedAt,
    outlet: article.outlet,
    url: article.url,
    agent: article.agent,
    tags: article.tags,
  };
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  const rateLimit = consumeRateLimit("news", auth.token.uid);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded for news feed." },
      {
        status: 429,
        headers: {
          "retry-after": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const requestPath = new URL(request.url).pathname;
  const userId = auth.token.uid;

  async function logNewsRead(eventMetadata: Record<string, string | number | boolean | null>) {
    try {
      await writeAuditEvent({
        userId,
        eventType: "news.read",
        path: requestPath,
        metadata: eventMetadata,
      });
    } catch (error) {
      captureException(error, {
        route: "/api/news",
        component: "audit-log-write",
      });
    }
  }

  try {
    const groupedArticles = await Promise.all(
      INGESTION_AGENTS.map((agent) => getRecentArticlesByAgent(agent, since, 20)),
    );
    const articles = groupedArticles
      .flat()
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 50);
    if (articles.length > 0) {
      await logNewsRead({
        mode: "live-firestore",
        count: articles.length,
      });
      return NextResponse.json(articles.map(mapArticleToNewsItem), {
        headers: { "x-petrosignal-runtime-mode": "live-firestore" },
      });
    }
  } catch (error) {
    captureException(error, {
      route: "/api/news",
      component: "news-route",
    });
  }

  await logNewsRead({
    mode: "fallback-mock",
    count: 0,
  });
  return NextResponse.json(getMockNews(), {
    headers: { "x-petrosignal-runtime-mode": "fallback-mock" },
  });
}
