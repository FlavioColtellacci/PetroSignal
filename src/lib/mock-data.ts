import type {
  AgentStatus,
  AlertItem,
  BriefingDocument,
  BriefingRole,
  MetricSnapshot,
  NewsItem,
} from "@/types/domain";

const MOCK_DATE = "2026-05-07";
const MOCK_GENERATED_AT = "2026-05-07T09:00:00.000Z";

const BRIEFING_TEMPLATES: Record<
  BriefingRole,
  Omit<BriefingDocument, "role" | "generatedAt">
> = {
  investor: {
    date: MOCK_DATE,
    sections: [
      {
        label: "Macro catalysts",
        content:
          "Heavy crude benchmark spreads remain wide as export bottlenecks persist, supporting near-term arbitrage for LatAm-focused portfolios.",
      },
      {
        label: "Capital risk flags",
        content:
          "US sanctions enforcement remains uneven but headline-sensitive; prioritize counterparties with transparent ownership and compliant settlement rails.",
      },
    ],
    sources: [
      {
        url: "https://example.com/investor-1",
        title: "Crude spread update",
      },
      {
        url: "https://example.com/investor-2",
        title: "Regional sanctions brief",
      },
    ],
  },
  consultant: {
    date: MOCK_DATE,
    sections: [
      {
        label: "Client talking points",
        content:
          "Operators prioritize uptime improvements over net-new capex; advisory demand is concentrated in reliability, procurement, and compliance execution.",
      },
      {
        label: "Engagement opportunities",
        content:
          "Joint-venture governance reviews and contract restructuring are accelerating where counterparties face delayed receivables.",
      },
    ],
    sources: [
      {
        url: "https://example.com/consultant-1",
        title: "Operator interview roundup",
      },
    ],
  },
  service_company: {
    date: MOCK_DATE,
    sections: [
      {
        label: "Procurement signals",
        content:
          "Orders for rotating equipment and maintenance chemicals increased in western basins, with preference for vendors offering local inventory.",
      },
      {
        label: "Operator activity",
        content:
          "Field work programs are being re-sequenced to shorter cycles, favoring contractors that can mobilize multi-discipline teams quickly.",
      },
    ],
    sources: [
      {
        url: "https://example.com/service-company-1",
        title: "Procurement watchlist",
      },
    ],
  },
  compliance: {
    date: MOCK_DATE,
    sections: [
      {
        label: "Regulatory updates",
        content:
          "Recent advisories reiterate enhanced due-diligence obligations for maritime and energy payments involving layered intermediaries.",
      },
      {
        label: "Immediate actions",
        content:
          "Refresh beneficial ownership attestations and apply transaction-level screening to counterparties linked to high-risk vessel movements.",
      },
    ],
    sources: [
      {
        url: "https://example.com/compliance-1",
        title: "Energy compliance bulletin",
      },
    ],
  },
  engineer: {
    date: MOCK_DATE,
    sections: [
      {
        label: "Operational focus",
        content:
          "Main downtime contributors this week were power quality events and delayed spare parts for compression trains.",
      },
      {
        label: "Technical priorities",
        content:
          "Prioritize predictive maintenance on artificial lift systems and tighten turnaround planning windows to reduce production losses.",
      },
    ],
    sources: [
      {
        url: "https://example.com/engineer-1",
        title: "Field operations pulse",
      },
    ],
  },
};

const ALERTS: AlertItem[] = [
  {
    id: "alert-001",
    title: "Port clearance delays reported",
    summary:
      "Two export terminals reported customs throughput reductions that may affect lift schedules over the next 48 hours.",
    severity: "high",
    timestamp: "2026-05-07T08:15:00.000Z",
    source: {
      url: "https://example.com/alerts/port-clearance",
      title: "Terminal operations note",
    },
  },
  {
    id: "alert-002",
    title: "Pipeline pressure anomaly",
    summary:
      "Transient pressure drops detected on a primary gathering line; no outage confirmed, monitoring remains active.",
    severity: "medium",
    timestamp: "2026-05-07T07:40:00.000Z",
    source: {
      url: "https://example.com/alerts/pipeline",
      title: "Field telemetry digest",
    },
  },
];

const NEWS: NewsItem[] = [
  {
    id: "news-001",
    headline: "Regional upgrader maintenance window adjusted",
    summary:
      "Maintenance scope was narrowed to reduce offline hours, improving expected product availability for the month.",
    publishedAt: "2026-05-07T06:55:00.000Z",
    outlet: "Energy Desk",
    url: "https://example.com/news/upgrader-maintenance",
  },
  {
    id: "news-002",
    headline: "Shipping rates climb on Atlantic heavy routes",
    summary:
      "Higher charter demand and constrained vessel supply pushed spot rates up compared with last week.",
    publishedAt: "2026-05-07T05:20:00.000Z",
    outlet: "Maritime Wire",
    url: "https://example.com/news/shipping-rates",
  },
];

const AGENT_STATUS: AgentStatus[] = [
  {
    name: "Sanctions Agent",
    health: "online",
    lastCheckAt: "2026-05-07T08:25:00.000Z",
    note: "Monitoring sanctions lists and policy updates.",
  },
  {
    name: "PDVSA Agent",
    health: "processing",
    lastCheckAt: "2026-05-07T08:23:00.000Z",
    note: "Refreshing production and offtake signals.",
  },
  {
    name: "Market Agent",
    health: "online",
    lastCheckAt: "2026-05-07T08:24:00.000Z",
    note: "Tracking pricing, freight, and spread movements.",
  },
  {
    name: "JV Tracker",
    health: "degraded",
    lastCheckAt: "2026-05-07T08:22:00.000Z",
    note: "One source endpoint timing out; retry loop active.",
  },
  {
    name: "Social Agent",
    health: "online",
    lastCheckAt: "2026-05-07T08:26:00.000Z",
    note: "Collecting public chatter and sentiment shifts.",
  },
];

const METRICS: MetricSnapshot[] = [
  {
    id: "metric-active-alerts",
    label: "Active Alerts",
    value: 12,
    delta: 3,
    trend: "up",
    capturedAt: "2026-05-07T08:30:00.000Z",
  },
  {
    id: "metric-sources-monitored",
    label: "Sources Monitored",
    value: 184,
    delta: 4,
    trend: "up",
    capturedAt: "2026-05-07T08:30:00.000Z",
  },
  {
    id: "metric-jvs-tracked",
    label: "JVs Tracked",
    value: 27,
    delta: 0,
    trend: "flat",
    capturedAt: "2026-05-07T08:30:00.000Z",
  },
  {
    id: "metric-sanctions-changes",
    label: "Sanctions Changes",
    value: 5,
    unit: "/7d",
    delta: -1,
    trend: "down",
    capturedAt: "2026-05-07T08:30:00.000Z",
  },
];

export function getMockBriefing(role: BriefingRole): BriefingDocument {
  const template = BRIEFING_TEMPLATES[role];

  return {
    role,
    date: template.date,
    sections: template.sections.map((section) => ({ ...section })),
    sources: template.sources.map((source) => ({ ...source })),
    generatedAt: MOCK_GENERATED_AT,
  };
}

export function getMockAlerts(): AlertItem[] {
  return ALERTS.map((alert) => ({
    ...alert,
    source: { ...alert.source },
  }));
}

export function getMockNews(): NewsItem[] {
  return NEWS.map((item) => ({ ...item }));
}

export function getMockAgentStatus(): AgentStatus[] {
  return AGENT_STATUS.map((status) => ({ ...status }));
}

export function getMockMetrics(): MetricSnapshot[] {
  return METRICS.map((metric) => ({ ...metric }));
}
