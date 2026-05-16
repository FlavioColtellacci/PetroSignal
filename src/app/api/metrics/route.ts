import { NextResponse } from "next/server";
import type { CollectionReference, Query } from "firebase-admin/firestore";

import { requireAuthenticatedRequest } from "@/lib/api-auth";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { captureException } from "@/lib/monitoring";
import { getMockMetrics } from "@/lib/mock-data";
import { consumeRateLimit } from "@/lib/rate-limit";
import type { MetricSnapshot } from "@/types/domain";

type MetricsWindow = {
  currentStartIso: string;
  previousStartIso: string;
  previousEndIso: string;
};

function trendFromDelta(delta: number): MetricSnapshot["trend"] {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function buildWindow(durationMs: number): MetricsWindow {
  const now = Date.now();
  const currentStartMs = now - durationMs;
  const previousStartMs = now - durationMs * 2;
  return {
    currentStartIso: new Date(currentStartMs).toISOString(),
    previousStartIso: new Date(previousStartMs).toISOString(),
    previousEndIso: new Date(currentStartMs).toISOString(),
  };
}

async function countQuery(query: Query): Promise<number> {
  const aggregate = await query.count().get();
  return aggregate.data().count;
}

async function countDistinctOutlets(
  articlesCollection: CollectionReference,
  startIso: string,
  endIso?: string,
): Promise<number> {
  let query: Query = articlesCollection
    .where("publishedAt", ">=", startIso)
    .orderBy("publishedAt", "desc");

  if (endIso) {
    query = query.where("publishedAt", "<", endIso);
  }

  const snapshot = await query.select("outlet").get();
  const outlets = new Set<string>();
  for (const doc of snapshot.docs) {
    const outlet = doc.get("outlet");
    if (typeof outlet === "string" && outlet.trim().length > 0) {
      outlets.add(outlet);
    }
  }
  return outlets.size;
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  const rateLimit = consumeRateLimit("metrics", auth.token.uid);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded for metrics feed." },
      {
        status: 429,
        headers: {
          "retry-after": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  const db = getFirestoreDb();
  if (!db) {
    return NextResponse.json(getMockMetrics(), {
      headers: { "x-petrosignal-runtime-mode": "fallback-mock" },
    });
  }

  const nowIso = new Date().toISOString();
  const oneDayWindow = buildWindow(24 * 60 * 60 * 1000);
  const sevenDayWindow = buildWindow(7 * 24 * 60 * 60 * 1000);
  const alertsCollection = db.collection("alerts");
  const articlesCollection = db.collection("articles");

  try {
    const [
      activeAlertsCurrent,
      activeAlertsPrevious,
      sourcesMonitoredCurrent,
      sourcesMonitoredPrevious,
      jvTrackedCurrent,
      jvTrackedPrevious,
      sanctionsChangesCurrent,
      sanctionsChangesPrevious,
    ] = await Promise.all([
      countQuery(alertsCollection.where("timestamp", ">=", oneDayWindow.currentStartIso)),
      countQuery(
        alertsCollection
          .where("timestamp", ">=", oneDayWindow.previousStartIso)
          .where("timestamp", "<", oneDayWindow.previousEndIso),
      ),
      countDistinctOutlets(articlesCollection, sevenDayWindow.currentStartIso),
      countDistinctOutlets(
        articlesCollection,
        sevenDayWindow.previousStartIso,
        sevenDayWindow.previousEndIso,
      ),
      countQuery(
        articlesCollection
          .where("agent", "==", "jv_tracker")
          .where("publishedAt", ">=", sevenDayWindow.currentStartIso),
      ),
      countQuery(
        articlesCollection
          .where("agent", "==", "jv_tracker")
          .where("publishedAt", ">=", sevenDayWindow.previousStartIso)
          .where("publishedAt", "<", sevenDayWindow.previousEndIso),
      ),
      countQuery(
        articlesCollection
          .where("agent", "==", "sanctions")
          .where("publishedAt", ">=", sevenDayWindow.currentStartIso),
      ),
      countQuery(
        articlesCollection
          .where("agent", "==", "sanctions")
          .where("publishedAt", ">=", sevenDayWindow.previousStartIso)
          .where("publishedAt", "<", sevenDayWindow.previousEndIso),
      ),
    ]);

    const metrics: MetricSnapshot[] = [
      {
        id: "metric-active-alerts",
        label: "Active Alerts",
        value: activeAlertsCurrent,
        delta: activeAlertsCurrent - activeAlertsPrevious,
        trend: trendFromDelta(activeAlertsCurrent - activeAlertsPrevious),
        capturedAt: nowIso,
      },
      {
        id: "metric-sources-monitored",
        label: "Sources Monitored",
        value: sourcesMonitoredCurrent,
        delta: sourcesMonitoredCurrent - sourcesMonitoredPrevious,
        trend: trendFromDelta(sourcesMonitoredCurrent - sourcesMonitoredPrevious),
        capturedAt: nowIso,
      },
      {
        id: "metric-jvs-tracked",
        label: "JVs Tracked",
        value: jvTrackedCurrent,
        delta: jvTrackedCurrent - jvTrackedPrevious,
        trend: trendFromDelta(jvTrackedCurrent - jvTrackedPrevious),
        capturedAt: nowIso,
      },
      {
        id: "metric-sanctions-changes",
        label: "Sanctions Changes",
        value: sanctionsChangesCurrent,
        unit: "/7d",
        delta: sanctionsChangesCurrent - sanctionsChangesPrevious,
        trend: trendFromDelta(sanctionsChangesCurrent - sanctionsChangesPrevious),
        capturedAt: nowIso,
      },
    ];

    const hasAnyData = metrics.some((metric) => metric.value > 0);
    if (hasAnyData) {
      return NextResponse.json(metrics, {
        headers: { "x-petrosignal-runtime-mode": "live-firestore" },
      });
    }
    return NextResponse.json(getMockMetrics(), {
      headers: { "x-petrosignal-runtime-mode": "fallback-mock" },
    });
  } catch (error) {
    captureException(error, {
      route: "/api/metrics",
      component: "metrics-route",
    });
    return NextResponse.json(getMockMetrics(), {
      headers: { "x-petrosignal-runtime-mode": "fallback-mock" },
    });
  }
}
