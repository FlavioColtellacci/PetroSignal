import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const recentAlertsMock = vi.fn();
const mockAlertsMock = vi.fn();

vi.mock("@/lib/api-auth", () => ({
  requireAuthenticatedRequest: authMock,
}));

vi.mock("@/lib/repositories/alerts-repository", () => ({
  getRecentAlerts: recentAlertsMock,
}));

vi.mock("@/lib/mock-data", () => ({
  getMockAlerts: mockAlertsMock,
}));

describe("/api/alerts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns live alerts when Firestore has rows", async () => {
    authMock.mockResolvedValue({ ok: true, token: { uid: "u-1" } });
    recentAlertsMock.mockResolvedValue([{ id: "alert-1", severity: "high" }]);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/alerts"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-petrosignal-runtime-mode")).toBe("live-firestore");
    const payload = await response.json();
    expect(payload[0].id).toBe("alert-1");
  });

  it("falls back to mock alerts when Firestore read fails", async () => {
    authMock.mockResolvedValue({ ok: true, token: { uid: "u-1" } });
    recentAlertsMock.mockRejectedValue(new Error("boom"));
    mockAlertsMock.mockReturnValue([{ id: "mock-alert" }]);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/alerts"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-petrosignal-runtime-mode")).toBe("fallback-mock");
    const payload = await response.json();
    expect(payload[0].id).toBe("mock-alert");
  });
});
