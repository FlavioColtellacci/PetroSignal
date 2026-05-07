export interface SanctionsProviderItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  outlet: string;
  tags: string[];
}

export interface SanctionsProviderAdapter {
  fetchLatest(): Promise<SanctionsProviderItem[]>;
}

class MockSanctionsProviderAdapter implements SanctionsProviderAdapter {
  async fetchLatest(): Promise<SanctionsProviderItem[]> {
    const now = new Date();

    return [
      {
        title: "US issues new sanctions advisory for shipping counterparties",
        summary:
          "Treasury guidance expands scrutiny of shell entities supporting sanctioned cargo routing across Atlantic corridors.",
        url: "https://example.com/sanctions/us-shipping-advisory",
        publishedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        outlet: "Regulatory Monitor",
        tags: ["sanctions", "shipping", "compliance"],
      },
      {
        title: "Energy traders reassess settlement routes after sanctions update",
        summary:
          "Market participants are tightening payment controls and due diligence requirements on counterparties with opaque ownership.",
        url: "https://example.com/sanctions/settlement-routes",
        publishedAt: new Date(now.getTime() - 75 * 60 * 1000).toISOString(),
        outlet: "Energy Desk",
        tags: ["sanctions", "risk", "trading"],
      },
    ];
  }
}

export function createSanctionsProviderAdapter(): SanctionsProviderAdapter {
  return new MockSanctionsProviderAdapter();
}
