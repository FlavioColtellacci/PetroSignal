import type { AlertRecord, ArticleRecord } from "@/lib/firestore-types";
import type { BriefingDocument, BriefingRole } from "@/types/domain";

export interface BriefingProviderInput {
  role: BriefingRole;
  date: string;
  articles: ArticleRecord[];
  alerts: AlertRecord[];
}

export interface BriefingProviderAdapter {
  generate(input: BriefingProviderInput): Promise<BriefingDocument>;
}

class MockBriefingProviderAdapter implements BriefingProviderAdapter {
  async generate(input: BriefingProviderInput): Promise<BriefingDocument> {
    const topArticle = input.articles[0];
    const topAlert = input.alerts[0];

    const sections = [
      {
        label: "Sanctions landscape",
        content: topArticle
          ? `${topArticle.headline}. ${topArticle.summary}`
          : "No sanctions articles were ingested in the last 24 hours.",
      },
      {
        label: "Risk signals",
        content: topAlert
          ? `${topAlert.title}. ${topAlert.summary}`
          : "No high-priority sanctions alerts were generated in the last 24 hours.",
      },
    ];

    const sources = input.articles.slice(0, 5).map((article) => ({
      url: article.url,
      title: article.headline,
    }));

    return {
      role: input.role,
      date: input.date,
      sections,
      sources,
      generatedAt: new Date().toISOString(),
    };
  }
}

export function createBriefingProviderAdapter(): BriefingProviderAdapter {
  return new MockBriefingProviderAdapter();
}
