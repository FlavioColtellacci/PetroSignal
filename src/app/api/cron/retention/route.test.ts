import { describe, expect, it } from "vitest";

describe("/api/cron/retention", () => {
  it("returns 500 when CRON_SECRET is not configured", async () => {
    const previous = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/cron/retention"));

    expect(response.status).toBe(500);
    process.env.CRON_SECRET = previous;
  });

  it("returns 401 for invalid cron authorization", async () => {
    const previous = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "secret-value";

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/cron/retention", {
        headers: {
          authorization: "Bearer wrong-secret",
        },
      }),
    );

    expect(response.status).toBe(401);
    process.env.CRON_SECRET = previous;
  });
});
