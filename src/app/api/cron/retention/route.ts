import { NextResponse } from "next/server";

import { getFirestoreDb } from "@/lib/firebase-admin";
import { captureException } from "@/lib/monitoring";
import { runRetentionPurge } from "@/lib/repositories/data-retention-repository";

function readCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  return secret ? secret : null;
}

function isAuthorized(request: Request, cronSecret: string): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  const cronSecret = readCronSecret();
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is required for cron routes." }, { status: 500 });
  }

  if (!isAuthorized(request, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  try {
    const results = await runRetentionPurge();
    const totalDeleted = results.reduce((total, entry) => total + entry.deleted, 0);
    const firestoreEnabled = Boolean(getFirestoreDb());
    const warningFlags = [
      !firestoreEnabled ? "firestore-disabled" : null,
      results.some((entry) => entry.days <= 0) ? "retention-target-disabled" : null,
    ].filter((flag): flag is string => Boolean(flag));

    return NextResponse.json({
      status: "ok",
      firestoreEnabled,
      totalDeleted,
      warningFlags,
      results,
    });
  } catch (error) {
    captureException(error, {
      route: "/api/cron/retention",
      component: "retention-cron-route",
    });
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown retention cleanup failure.",
      },
      { status: 500 },
    );
  }
}
