import type { IngestionAgent } from "@/lib/firestore-types";

export interface IngestionProviderItem {
  agent: IngestionAgent;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  outlet: string;
  tags: string[];
}

export interface IngestionProviderAdapter {
  fetchLatest(agent: IngestionAgent): Promise<IngestionProviderItem[]>;
}

const AGENT_QUERIES: Record<IngestionAgent, string> = {
  sanctions: "Venezuela oil sanctions OFAC PDVSA",
  pdvsa: "PDVSA production export update",
  market: "Venezuelan crude market spreads freight",
  jv_tracker: "Venezuela oil joint venture update",
  social: "Venezuela oil refinery strike protest social",
};

const AGENT_TAGS: Record<IngestionAgent, string[]> = {
  sanctions: ["sanctions", "regulation", "compliance"],
  pdvsa: ["pdvsa", "production", "exports"],
  market: ["market", "pricing", "freight"],
  jv_tracker: ["joint-venture", "partner", "governance"],
  social: ["social", "sentiment", "labor"],
};

class MockIngestionProviderAdapter implements IngestionProviderAdapter {
  async fetchLatest(agent: IngestionAgent): Promise<IngestionProviderItem[]> {
    const now = new Date();

    const baseTag = AGENT_TAGS[agent];
    const domain = `https://example.com/${agent}`;
    const titlePrefix =
      agent === "jv_tracker"
        ? "JV tracker"
        : agent === "pdvsa"
          ? "PDVSA"
          : agent === "market"
            ? "Market"
            : agent === "social"
              ? "Social"
              : "Sanctions";

    return [
      {
        agent,
        title: `${titlePrefix} signal: regional update from monitored sources`,
        summary:
          "Collected intelligence indicates counterparties are adjusting operations and risk controls amid evolving Venezuela petroleum conditions.",
        url: `${domain}/update-1`,
        publishedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        outlet: "PetroSignal Monitor",
        tags: [...baseTag, "daily-brief"],
      },
      {
        agent,
        title: `${titlePrefix} signal: counterparties revise near-term planning assumptions`,
        summary:
          "Operators and trading desks are reprioritizing continuity planning based on fresh operational, policy, and market inputs.",
        url: `${domain}/update-2`,
        publishedAt: new Date(now.getTime() - 75 * 60 * 1000).toISOString(),
        outlet: "Energy Desk",
        tags: [...baseTag, "risk"],
      },
    ];
  }
}

class BraveIngestionProviderAdapter implements IngestionProviderAdapter {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchLatest(agent: IngestionAgent): Promise<IngestionProviderItem[]> {
    const query = encodeURIComponent(AGENT_QUERIES[agent]);
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${query}&count=10&freshness=pd`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": this.apiKey,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Brave request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      web?: {
        results?: Array<{
          title?: string;
          description?: string;
          url?: string;
          profile?: { name?: string };
        }>;
      };
    };

    const now = new Date().toISOString();
    return (data.web?.results ?? [])
      .filter((item) => Boolean(item.url && item.title && item.description))
      .map((item) => ({
        agent,
        title: item.title ?? "Untitled",
        summary: item.description ?? "No summary provided.",
        url: item.url ?? "",
        publishedAt: now,
        outlet: item.profile?.name ?? "Brave Search",
        tags: AGENT_TAGS[agent],
      }));
  }
}

class SerperIngestionProviderAdapter implements IngestionProviderAdapter {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchLatest(agent: IngestionAgent): Promise<IngestionProviderItem[]> {
    const response = await fetch("https://google.serper.dev/news", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": this.apiKey,
      },
      body: JSON.stringify({
        q: AGENT_QUERIES[agent],
        num: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      news?: Array<{
        title?: string;
        snippet?: string;
        link?: string;
        source?: string;
        date?: string;
      }>;
    };

    const now = new Date().toISOString();
    return (data.news ?? [])
      .filter((item) => Boolean(item.link && item.title && item.snippet))
      .map((item) => ({
        agent,
        title: item.title ?? "Untitled",
        summary: item.snippet ?? "No summary provided.",
        url: item.link ?? "",
        publishedAt: now,
        outlet: item.source ?? "Serper News",
        tags: AGENT_TAGS[agent],
      }));
  }
}

class CompositeIngestionProviderAdapter implements IngestionProviderAdapter {
  private readonly mockAdapter = new MockIngestionProviderAdapter();

  private readonly braveAdapter = process.env.BRAVE_API_KEY
    ? new BraveIngestionProviderAdapter(process.env.BRAVE_API_KEY)
    : null;

  private readonly serperAdapter = process.env.SERPER_API_KEY
    ? new SerperIngestionProviderAdapter(process.env.SERPER_API_KEY)
    : null;

  async fetchLatest(agent: IngestionAgent): Promise<IngestionProviderItem[]> {
    const errors: string[] = [];

    if (this.braveAdapter) {
      try {
        const braveItems = await this.braveAdapter.fetchLatest(agent);
        if (braveItems.length > 0) {
          return braveItems;
        }
        errors.push("Brave returned no items");
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Brave failed");
      }
    } else {
      errors.push("BRAVE_API_KEY not set");
    }

    if (this.serperAdapter) {
      try {
        const serperItems = await this.serperAdapter.fetchLatest(agent);
        if (serperItems.length > 0) {
          return serperItems;
        }
        errors.push("Serper returned no items");
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Serper failed");
      }
    } else {
      errors.push("SERPER_API_KEY not set");
    }

    console.error(`[ingestion-provider] Falling back to mock for ${agent}`, errors.join(" | "));
    return this.mockAdapter.fetchLatest(agent);
  }
}

export function createSanctionsProviderAdapter(): IngestionProviderAdapter {
  return new CompositeIngestionProviderAdapter();
}
