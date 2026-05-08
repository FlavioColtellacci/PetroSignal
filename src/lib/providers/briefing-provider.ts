import { generateText } from "ai";
import { z } from "zod";
import { minimaxOpenAI } from "vercel-minimax-ai-provider";

import { buildBriefingPrompt } from "@/lib/prompts/investor-briefing-prompt";
import type {
  AlertRecord,
  ArticleRecord,
  BriefingProviderTelemetry,
} from "@/lib/firestore-types";
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

    return {
      document: {
        role: input.role,
        date: input.date,
        sections,
        sources: deriveSourcesFromInput(input),
        generatedAt: new Date().toISOString(),
      },
      telemetry: {
        provider: "fallback-mock",
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

    return {
      document: {
        role: input.role,
        date: input.date,
        sections: validated.sections,
        sources: deriveSourcesFromInput(input),
        generatedAt: new Date().toISOString(),
      },
      telemetry: {
        provider: "minimax",
        model,
        latencyMs: Date.now() - start,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
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
        return await this.minimaxAdapter.generate(input);
      } catch (error) {
        console.error("[briefing-provider] MiniMax failed, falling back", error);

        const mockResult = await this.mockAdapter.generate(input);
        return {
          ...mockResult,
          telemetry: {
            provider: "fallback-mock",
            errorMessage:
              error instanceof Error ? error.message : "Unknown MiniMax error",
          },
        };
      }
    }

    const mockResult = await this.mockAdapter.generate(input);
    return {
      ...mockResult,
      telemetry: {
        provider: "fallback-mock",
        errorMessage: "MINIMAX_API_KEY not set",
      },
    };
  }
}

export function createBriefingProviderAdapter(): BriefingProviderAdapter {
  return new CompositeBriefingProviderAdapter();
}
