import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const recentArticlesMock = vi.fn();
const mockNewsMock = vi.fn();

vi.mock("@/lib/api-auth", () => ({
  requireAuthenticatedRequest: authMock,
}));

vi.mock("@/lib/repositories/articles-repository", () => ({
  getRecentArticlesByAgent: recentArticlesMock,
}));

vi.mock("@/lib/mock-data", () => ({
  getMockNews: mockNewsMock,
}));

describe("/api/news", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns live Firestore data when articles exist", async () => {
    authMock.mockResolvedValue({ ok: true, token: { uid: "u-1" } });
    recentArticlesMock
      .mockResolvedValueOnce([
        {
          id: "article-1",
          headline: "Headline",
          summary: "Summary",
          publishedAt: "2026-05-16T10:00:00.000Z",
          outlet: "Outlet",
          url: "https://example.com",
          agent: "sanctions",
          tags: ["tag"],
        },
      ])
      .mockResolvedValue([]);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/news"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-petrosignal-runtime-mode")).toBe("live-firestore");
    const payload = await response.json();
    expect(payload).toHaveLength(1);
    expect(payload[0].id).toBe("article-1");
  });

  it("falls back to mock data on Firestore failure", async () => {
    authMock.mockResolvedValue({ ok: true, token: { uid: "u-1" } });
    recentArticlesMock.mockRejectedValue(new Error("boom"));
    mockNewsMock.mockReturnValue([{ id: "mock-news" }]);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/news"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-petrosignal-runtime-mode")).toBe("fallback-mock");
    const payload = await response.json();
    expect(payload[0].id).toBe("mock-news");
  });
});
