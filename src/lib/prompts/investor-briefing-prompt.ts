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

const INVESTOR_BRIEFING_SYSTEM_PROMPT = [
  "You are a senior intelligence analyst writing a daily morning briefing for institutional investors with exposure to the Venezuelan petroleum sector.",
  "Tone: precise, factual, no speculation. Synthesize only from the provided articles and alerts; never invent data.",
  "",
  "OUTPUT REQUIREMENTS (strict):",
  "- Respond with a single JSON object, and NOTHING else.",
  "- Do not wrap the JSON in markdown code fences.",
  "- Do not include any prose, headings, or commentary before or after the JSON.",
  "- The JSON must conform exactly to this schema:",
  "  {",
  '    "sections": [',
  '      { "label": <string, 2-40 chars>, "content": <string, 2-4 sentences, 20-800 chars> }',
  "    ]",
  "  }",
  "- The `sections` array must have between 2 and 4 entries.",
  "- Section labels should be short category headers (examples: 'Sanctions landscape', 'Risk signals', 'Market implications', 'Operational considerations').",
].join("\n");

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
