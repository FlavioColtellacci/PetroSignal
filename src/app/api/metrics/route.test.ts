import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const dbMock = vi.fn();
const mockMetricsMock = vi.fn();

vi.mock("@/lib/api-auth", () => ({
  requireAuthenticatedRequest: authMock,
}));

vi.mock("@/lib/firebase-admin", () => ({
  getFirestoreDb: dbMock,
}));

vi.mock("@/lib/mock-data", () => ({
  getMockMetrics: mockMetricsMock,
}));

describe("/api/metrics", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns mock metrics when Firestore is unavailable", async () => {
    authMock.mockResolvedValue({ ok: true, token: { uid: "u-1" } });
    dbMock.mockReturnValue(null);
    mockMetricsMock.mockReturnValue([{ id: "metric-1" }]);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/metrics"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-petrosignal-runtime-mode")).toBe("fallback-mock");
    const payload = await response.json();
    expect(payload[0].id).toBe("metric-1");
  });
});
