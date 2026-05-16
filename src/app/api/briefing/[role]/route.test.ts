import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const latestBriefingMock = vi.fn();
const mockBriefingMock = vi.fn();

vi.mock("@/lib/api-auth", () => ({
  requireAuthenticatedRequest: authMock,
}));

vi.mock("@/lib/repositories/briefings-repository", () => ({
  getLatestBriefingByRole: latestBriefingMock,
}));

vi.mock("@/lib/mock-data", () => ({
  getMockBriefing: mockBriefingMock,
}));

describe("/api/briefing/[role]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authMock.mockResolvedValue({ ok: true, token: { uid: "u-1" } });
  });

  it("returns 400 for unsupported role", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/briefing/invalid"), {
      params: Promise.resolve({ role: "invalid" }),
    });

    expect(response.status).toBe(400);
  });

  it("falls back to mock briefing when live record is missing", async () => {
    latestBriefingMock.mockResolvedValue(null);
    mockBriefingMock.mockReturnValue({
      role: "investor",
      date: "2026-05-16",
      generatedAt: "2026-05-16T10:00:00.000Z",
      sections: [],
      sources: [],
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/briefing/investor"), {
      params: Promise.resolve({ role: "investor" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-petrosignal-runtime-mode")).toBe("fallback-mock");
  });
});
