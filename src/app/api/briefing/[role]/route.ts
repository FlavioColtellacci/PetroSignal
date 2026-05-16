import { NextResponse } from "next/server";

import { requireAuthenticatedRequest } from "@/lib/api-auth";
import { captureException } from "@/lib/monitoring";
import { consumeRateLimit } from "@/lib/rate-limit";
import { writeAuditEvent } from "@/lib/repositories/audit-events-repository";
import { getLatestBriefingByRole } from "@/lib/repositories/briefings-repository";
import { getMockBriefing } from "@/lib/mock-data";
import { BRIEFING_ROLES, type BriefingRole } from "@/types/domain";

function isBriefingRole(value: string): value is BriefingRole {
  return BRIEFING_ROLES.includes(value as BriefingRole);
}

interface RouteContext {
  params: Promise<{ role: string }>;
}

function toBriefingDocument(
  record: NonNullable<Awaited<ReturnType<typeof getLatestBriefingByRole>>>,
) {
  return {
    role: record.role,
    date: record.date,
    sections: record.sections,
    sources: record.sources,
    generatedAt: record.generatedAt,
  };
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.token.uid;
  const rateLimit = consumeRateLimit("briefing", userId);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded for briefing reads." },
      {
        status: 429,
        headers: {
          "retry-after": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  const { role } = await context.params;
  const requestPath = new URL(request.url).pathname;

  if (!isBriefingRole(role)) {
    return NextResponse.json(
      {
        error: `Unsupported role "${role}".`,
        validRoles: BRIEFING_ROLES,
      },
      { status: 400 },
    );
  }

  async function logBriefingRead(mode: "live-firestore" | "fallback-mock") {
    try {
      await writeAuditEvent({
        userId,
        eventType: "briefing.read",
        path: requestPath,
        metadata: {
          role,
          mode,
        },
      });
    } catch (error) {
      captureException(error, {
        route: "/api/briefing/[role]",
        component: "audit-log-write",
        details: { role },
      });
    }
  }

  try {
    const firestoreBriefing = await getLatestBriefingByRole(role);
    if (firestoreBriefing) {
      await logBriefingRead("live-firestore");
      return NextResponse.json(toBriefingDocument(firestoreBriefing), {
        headers: { "x-petrosignal-runtime-mode": "live-firestore" },
      });
    }
  } catch (error) {
    captureException(error, {
      route: "/api/briefing/[role]",
      component: "briefing-route",
      details: { role },
    });
  }

  await logBriefingRead("fallback-mock");
  return NextResponse.json(getMockBriefing(role), {
    headers: { "x-petrosignal-runtime-mode": "fallback-mock" },
  });
}
