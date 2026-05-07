import { NextResponse } from "next/server";

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
  };
}

export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const articles = await getRecentArticlesByAgent("sanctions", since, 50);
    if (articles.length > 0) {
      return NextResponse.json(articles.map(mapArticleToNewsItem));
    }
  } catch (error) {
    console.error("Failed to read news from Firestore, falling back to mock.", error);
  }

  return NextResponse.json(getMockNews());
}
