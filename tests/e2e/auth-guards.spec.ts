import { expect, test } from "@playwright/test";

test.describe("Auth guard", () => {
  test("blocks unauthenticated news API requests", async ({ request }) => {
    const response = await request.get("/api/news");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "Unauthorized." });
  });

  test("blocks unauthenticated briefing API requests", async ({ request }) => {
    const response = await request.get("/api/briefing/investor");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "Unauthorized." });
  });
});
