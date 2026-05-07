import type { BriefingDocument } from "@/types/domain";

export interface ArticleRecord {
  id: string;
  agent: "sanctions";
  headline: string;
  summary: string;
  outlet: string;
  url: string;
  canonicalUrl: string;
  canonicalUrlHash: string;
  publishedAt: string;
  tags: string[];
  ingestedAt: string;
}

export interface AlertRecord {
  id: string;
  title: string;
  summary: string;
  severity: "high" | "medium" | "low";
  timestamp: string;
  source: {
    url: string;
    title?: string;
  };
  articleId?: string;
  createdAt: string;
}

export type BriefingProviderName = "minimax" | "fallback-mock";

export interface BriefingProviderTelemetry {
  provider: BriefingProviderName;
  model?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  errorMessage?: string;
}

export interface BriefingRecord extends BriefingDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  telemetry?: BriefingProviderTelemetry;
}
