import { NextResponse } from "next/server";

import { requireAuthenticatedRequest } from "@/lib/api-auth";
import { captureException } from "@/lib/monitoring";
import { consumeRateLimit } from "@/lib/rate-limit";
import { writeAuditEvent } from "@/lib/repositories/audit-events-repository";
import { getRecentAlerts } from "@/lib/repositories/alerts-repository";
import { getMockAlerts } from "@/lib/mock-data";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  const rateLimit = consumeRateLimit("alerts", auth.token.uid);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded for alerts feed." },
      {
        status: 429,
        headers: {
          "retry-after": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const requestPath = new URL(request.url).pathname;
  const userId = auth.token.uid;

  async function logAlertsRead(eventMetadata: Record<string, string | number | boolean | null>) {
    try {
      await writeAuditEvent({
        userId,
        eventType: "alerts.read",
        path: requestPath,
        metadata: eventMetadata,
      });
    } catch (error) {
      captureException(error, {
        route: "/api/alerts",
        component: "audit-log-write",
      });
    }
  }

  try {
    const alerts = await getRecentAlerts(since, 50);
    if (alerts.length > 0) {
      await logAlertsRead({
        mode: "live-firestore",
        count: alerts.length,
      });
      return NextResponse.json(alerts, {
        headers: { "x-petrosignal-runtime-mode": "live-firestore" },
      });
    }
  } catch (error) {
    captureException(error, {
      route: "/api/alerts",
      component: "alerts-route",
    });
  }

  await logAlertsRead({
    mode: "fallback-mock",
    count: 0,
  });
  return NextResponse.json(getMockAlerts(), {
    headers: { "x-petrosignal-runtime-mode": "fallback-mock" },
  });
}
