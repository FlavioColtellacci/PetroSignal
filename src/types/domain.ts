export const BRIEFING_ROLES = [
  "investor",
  "consultant",
  "service_company",
  "compliance",
  "engineer",
] as const;

export type BriefingRole = (typeof BRIEFING_ROLES)[number];

export interface BriefingSection {
  label: string;
  content: string;
}

export interface BriefingSource {
  url: string;
  title?: string;
}

/**
 * Canonical briefing document shape for Phase 1 mocks and Phase 2 MiniMax output.
 */
export interface BriefingDocument {
  role: BriefingRole;
  date: string;
  sections: BriefingSection[];
  sources: BriefingSource[];
  generatedAt: string;
}

export type AlertSeverity = "high" | "medium" | "low";

export interface AlertItem {
  id: string;
  title: string;
  summary: string;
  severity: AlertSeverity;
  timestamp: string;
  source: BriefingSource;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  publishedAt: string;
  outlet: string;
  url: string;
}

export const AGENT_NAMES = [
  "Sanctions Agent",
  "PDVSA Agent",
  "Market Agent",
  "JV Tracker",
  "Social Agent",
] as const;

export type AgentName = (typeof AGENT_NAMES)[number];
export type AgentHealth = "online" | "degraded" | "offline" | "processing";

export interface AgentStatus {
  name: AgentName;
  health: AgentHealth;
  lastCheckAt: string;
  note: string;
}
