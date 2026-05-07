import type { AlertRecord, ArticleRecord } from "@/lib/firestore-types";
import type { BriefingRole } from "@/types/domain";

export interface InvestorBriefingPromptInput {
  role: BriefingRole;
  date: string;
  articles: ArticleRecord[];
  alerts: AlertRecord[];
}

export interface InvestorBriefingPrompt {
  system: string;
  user: string;
}

const INVESTOR_BRIEFING_SYSTEM_PROMPT =
  "You are a senior intelligence analyst writing a daily morning briefing for institutional investors with exposure to the Venezuelan petroleum sector. " +
  "Tone: precise, factual, no speculation. " +
  "Synthesize only from the provided articles and alerts; never invent data. " +
  "Output 2-4 short sections labeled with category headers (for example: 'Sanctions landscape', 'Risk signals', 'Market implications'). " +
  "Each section must contain 2-4 sentences.";

function renderArticles(articles: ArticleRecord[]): string {
  if (articles.length === 0) {
    return "_No articles available in the last 24 hours._";
  }

  return articles
    .map(
      (article, index) =>
        [
          `#### Article ${index + 1}`,
          `- Headline: ${article.headline}`,
          `- Summary: ${article.summary}`,
          `- Outlet: ${article.outlet}`,
          `- Published At: ${article.publishedAt}`,
          `- URL: ${article.url}`,
        ].join("\n"),
    )
    .join("\n\n");
}

function renderAlerts(alerts: AlertRecord[]): string {
  if (alerts.length === 0) {
    return "_No alerts available in the last 24 hours._";
  }

  return alerts
    .map(
      (alert, index) =>
        [
          `#### Alert ${index + 1}`,
          `- Title: ${alert.title}`,
          `- Summary: ${alert.summary}`,
          `- Severity: ${alert.severity}`,
          `- Source: ${alert.source.title ?? "Unknown source"}`,
        ].join("\n"),
    )
    .join("\n\n");
}

export function buildInvestorBriefingPrompt(
  input: InvestorBriefingPromptInput,
): InvestorBriefingPrompt {
  const user = [
    "# Briefing Input",
    "",
    `- Date: ${input.date}`,
    `- Role: ${input.role}`,
    "",
    "## Articles",
    renderArticles(input.articles),
    "",
    "## Alerts",
    renderAlerts(input.alerts),
  ].join("\n");

  return {
    system: INVESTOR_BRIEFING_SYSTEM_PROMPT,
    user,
  };
}
