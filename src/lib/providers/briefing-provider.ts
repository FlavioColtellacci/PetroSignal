import { generateText } from "ai";
import { z } from "zod";
import { minimaxOpenAI } from "vercel-minimax-ai-provider";

import { buildBriefingPrompt } from "@/lib/prompts/investor-briefing-prompt";
import { captureException } from "@/lib/monitoring";
import type {
  AlertRecord,
  ArticleRecord,
  BriefingProviderTelemetry,
  IngestionAgent,
} from "@/lib/firestore-types";
import { INGESTION_AGENTS } from "@/lib/firestore-types";
import type { BriefingDocument, BriefingRole } from "@/types/domain";

export interface BriefingProviderInput {
  role: BriefingRole;
  date: string;
  articles: ArticleRecord[];
  alerts: AlertRecord[];
}

export interface BriefingProviderResult {
  document: BriefingDocument;
  telemetry: BriefingProviderTelemetry;
}

export interface BriefingProviderAdapter {
  generate(input: BriefingProviderInput): Promise<BriefingProviderResult>;
}

const MIN_SOURCE_DIVERSITY = 2;
const REPEATED_WORDING_THRESHOLD = 0.72;

const ROLE_AGENT_WEIGHTS: Record<BriefingRole, Record<IngestionAgent, number>> = {
  investor: {
    sanctions: 3,
    pdvsa: 3,
    market: 4,
    jv_tracker: 2,
    social: 1,
  },
  consultant: {
    sanctions: 2,
    pdvsa: 3,
    market: 3,
    jv_tracker: 3,
    social: 1,
  },
  service_company: {
    sanctions: 2,
    pdvsa: 4,
    market: 2,
    jv_tracker: 3,
    social: 2,
  },
  compliance: {
    sanctions: 5,
    pdvsa: 2,
    market: 2,
    jv_tracker: 1,
    social: 1,
  },
  engineer: {
    sanctions: 1,
    pdvsa: 4,
    market: 2,
    jv_tracker: 4,
    social: 2,
  },
};

interface RoleAwareSelectionInput {
  role: BriefingRole;
  articles: ArticleRecord[];
  maxArticles?: number;
}

function sortArticlesByPublishedAtDesc(articles: ArticleRecord[]): ArticleRecord[] {
  return [...articles].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function groupArticlesByAgent(articles: ArticleRecord[]): Record<IngestionAgent, ArticleRecord[]> {
  const grouped = Object.fromEntries(
    INGESTION_AGENTS.map((agent) => [agent, [] as ArticleRecord[]]),
  ) as Record<IngestionAgent, ArticleRecord[]>;

  for (const article of sortArticlesByPublishedAtDesc(articles)) {
    grouped[article.agent].push(article);
  }

  return grouped;
}

function buildAgentQuota(
  role: BriefingRole,
  groupedArticles: Record<IngestionAgent, ArticleRecord[]>,
  maxArticles: number,
): Record<IngestionAgent, number> {
  const availableAgents = INGESTION_AGENTS.filter((agent) => groupedArticles[agent].length > 0);
  const quotas = Object.fromEntries(
    INGESTION_AGENTS.map((agent) => [agent, 0]),
  ) as Record<IngestionAgent, number>;

  if (availableAgents.length === 0 || maxArticles <= 0) {
    return quotas;
  }

  let remainingSlots = maxArticles;
  for (const agent of availableAgents) {
    if (remainingSlots === 0) {
      break;
    }
    quotas[agent] = 1;
    remainingSlots -= 1;
  }

  const weightedAgents = [...availableAgents].sort((left, right) => {
    const rightWeight = ROLE_AGENT_WEIGHTS[role][right];
    const leftWeight = ROLE_AGENT_WEIGHTS[role][left];
    return rightWeight - leftWeight;
  });

  while (remainingSlots > 0) {
    let allocatedInRound = false;
    for (const agent of weightedAgents) {
      if (remainingSlots === 0) {
        break;
      }
      if (quotas[agent] >= groupedArticles[agent].length) {
        continue;
      }
      quotas[agent] += 1;
      remainingSlots -= 1;
      allocatedInRound = true;
    }
    if (!allocatedInRound) {
      break;
    }
  }

  return quotas;
}

export function selectRoleAwareBriefingArticles(
  input: RoleAwareSelectionInput,
): ArticleRecord[] {
  const maxArticles = input.maxArticles ?? 12;
  const groupedArticles = groupArticlesByAgent(input.articles);
  const quotas = buildAgentQuota(input.role, groupedArticles, maxArticles);

  const selected = INGESTION_AGENTS.flatMap((agent) =>
    groupedArticles[agent].slice(0, quotas[agent]),
  );
  return sortArticlesByPublishedAtDesc(selected).slice(0, maxArticles);
}

class MockBriefingProviderAdapter implements BriefingProviderAdapter {
  async generate(input: BriefingProviderInput): Promise<BriefingProviderResult> {
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

    const document: BriefingDocument = {
      role: input.role,
      date: input.date,
      sections,
      sources: deriveSourcesFromInput(input),
      generatedAt: new Date().toISOString(),
    };
    const quality = collectQualityFlags(document, input);

    return {
      document,
      telemetry: {
        provider: "fallback-mock",
        qualityFlags: Array.from(new Set([...quality.flags, "fallback-provider-used"])),
        sourceDiversity: quality.sourceDiversity,
      },
    };
  }
}

const briefingOutputSchema = z.object({
  sections: z
    .array(
      z.object({
        label: z.string().min(2).max(40),
        content: z.string().min(20).max(800),
      }),
    )
    .min(2)
    .max(4),
});

function deriveSourcesFromInput(input: BriefingProviderInput) {
  return input.articles.slice(0, 5).map((article) => ({
    url: article.url,
    title: article.headline,
  }));
}

function normalizeForSimilarity(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function jaccardSimilarity(left: string, right: string): number {
  const leftSet = new Set(normalizeForSimilarity(left));
  const rightSet = new Set(normalizeForSimilarity(right));
  if (leftSet.size === 0 || rightSet.size === 0) {
    return 0;
  }
  let intersection = 0;
  leftSet.forEach((token) => {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  });
  const unionSet = new Set<string>();
  leftSet.forEach((token) => unionSet.add(token));
  rightSet.forEach((token) => unionSet.add(token));
  const unionSize = unionSet.size;
  return unionSize === 0 ? 0 : intersection / unionSize;
}

function collectQualityFlags(
  document: BriefingDocument,
  input: BriefingProviderInput,
): { flags: string[]; sourceDiversity: number } {
  const flags = new Set<string>();
  const sourceDiversity = new Set(
    input.articles
      .slice(0, 12)
      .map((article) => article.outlet.trim().toLowerCase())
      .filter(Boolean),
  ).size;

  if (sourceDiversity < MIN_SOURCE_DIVERSITY) {
    flags.add("low-source-diversity");
  }

  for (const section of document.sections) {
    if (section.content.trim().length < 40) {
      flags.add("empty-section-detected");
    }
  }

  for (let i = 0; i < document.sections.length; i += 1) {
    for (let j = i + 1; j < document.sections.length; j += 1) {
      const similarity = jaccardSimilarity(
        document.sections[i].content,
        document.sections[j].content,
      );
      if (similarity >= REPEATED_WORDING_THRESHOLD) {
        flags.add("repeated-wording-detected");
      }
    }
  }

  return { flags: Array.from(flags), sourceDiversity };
}

function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

class MiniMaxBriefingProviderAdapter implements BriefingProviderAdapter {
  async generate(input: BriefingProviderInput): Promise<BriefingProviderResult> {
    const start = Date.now();
    const model = process.env.MINIMAX_MODEL ?? "MiniMax-M2.7";
    const { system, user } = buildBriefingPrompt(input);

    const { text, usage } = await generateText({
      model: minimaxOpenAI(model),
      system,
      prompt: user,
      temperature: 0.3,
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(60_000),
    });

    const jsonPayload = extractJsonPayload(text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonPayload);
    } catch (cause) {
      throw new Error(
        `MiniMax response was not valid JSON. Raw text (first 300 chars): ${text.slice(0, 300)}`,
        { cause },
      );
    }
    const validated = briefingOutputSchema.parse(parsed);

    const document: BriefingDocument = {
      role: input.role,
      date: input.date,
      sections: validated.sections,
      sources: deriveSourcesFromInput(input),
      generatedAt: new Date().toISOString(),
    };
    const quality = collectQualityFlags(document, input);

    return {
      document,
      telemetry: {
        provider: "minimax",
        model,
        latencyMs: Date.now() - start,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        qualityFlags: quality.flags,
        sourceDiversity: quality.sourceDiversity,
      },
    };
  }
}

class CompositeBriefingProviderAdapter implements BriefingProviderAdapter {
  private readonly mockAdapter = new MockBriefingProviderAdapter();

  private readonly minimaxAdapter = new MiniMaxBriefingProviderAdapter();

  async generate(input: BriefingProviderInput): Promise<BriefingProviderResult> {
    if (process.env.MINIMAX_API_KEY) {
      try {
        const minimaxResult = await this.minimaxAdapter.generate(input);
        const qualityFlags = minimaxResult.telemetry.qualityFlags ?? [];
        if (qualityFlags.includes("empty-section-detected")) {
          throw new Error("Briefing quality checks failed: empty-section-detected");
        }
        return minimaxResult;
      } catch (error) {
        captureException(error, {
          component: "briefing-provider-minimax",
          details: { role: input.role },
        });

        const mockResult = await this.mockAdapter.generate(input);
        const quality = collectQualityFlags(mockResult.document, input);
        return {
          ...mockResult,
          telemetry: {
            provider: "fallback-mock",
            errorMessage:
              error instanceof Error ? error.message : "Unknown MiniMax error",
            qualityFlags: Array.from(
              new Set([...(quality.flags ?? []), "fallback-provider-used"]),
            ),
            sourceDiversity: quality.sourceDiversity,
          },
        };
      }
    }

    const mockResult = await this.mockAdapter.generate(input);
    captureException(new Error("Briefing provider fallback activated."), {
      component: "briefing-provider-fallback",
      details: { role: input.role, reason: "MINIMAX_API_KEY missing" },
    });
    const quality = collectQualityFlags(mockResult.document, input);
    return {
      ...mockResult,
      telemetry: {
        provider: "fallback-mock",
        errorMessage: "MINIMAX_API_KEY not set",
        qualityFlags: Array.from(
          new Set([...(quality.flags ?? []), "fallback-provider-used"]),
        ),
        sourceDiversity: quality.sourceDiversity,
      },
    };
  }
}

export function createBriefingProviderAdapter(): BriefingProviderAdapter {
  return new CompositeBriefingProviderAdapter();
}
