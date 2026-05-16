import type { BriefingDocument } from "@/types/domain";
import type { BriefingRole } from "@/types/domain";
import type { UserPreferences } from "@/types/domain";

export interface ArticleRecord {
  id: string;
  agent: IngestionAgent;
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

export const INGESTION_AGENTS = [
  "sanctions",
  "pdvsa",
  "market",
  "jv_tracker",
  "social",
] as const;

export type IngestionAgent = (typeof INGESTION_AGENTS)[number];

export interface AlertRecord {
  id: string;
  agent: IngestionAgent;
  title: string;
  summary: string;
  severity: "high" | "medium" | "low";
  score: number;
  matchedSignals: string[];
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
  qualityFlags?: string[];
  sourceDiversity?: number;
}

export interface BriefingRecord extends BriefingDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  telemetry?: BriefingProviderTelemetry;
}

export const AGENT_RUN_TYPES = ["ingest", "briefing"] as const;
export type AgentRunType = (typeof AGENT_RUN_TYPES)[number];

export const AGENT_RUN_STATUSES = ["started", "success", "failure", "partial_failure"] as const;
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export interface AgentRunRecord {
  id: string;
  runType: AgentRunType;
  agent?: IngestionAgent;
  role?: BriefingRole;
  provider: string;
  status: AgentRunStatus;
  startedAt: string;
  finishedAt?: string;
  itemsFetched: number;
  errors: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferencesRecord {
  id: string;
  userId: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface BriefingShareRecord {
  id: string;
  userId: string;
  role: BriefingRole;
  briefingId: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuditEventRecord {
  id: string;
  userId: string;
  eventType: "news.read" | "alerts.read" | "briefing.read" | "briefing.export";
  path: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyRecord {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  status: "active" | "revoked";
  createdBy: string;
  createdAt: string;
  revokedAt?: string;
}
