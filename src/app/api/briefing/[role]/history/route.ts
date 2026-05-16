import { NextResponse } from "next/server";

import { requireAuthenticatedRequest } from "@/lib/api-auth";
import { captureException } from "@/lib/monitoring";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getBriefingsByRole } from "@/lib/repositories/briefings-repository";
import { BRIEFING_ROLES, type BriefingRole } from "@/types/domain";

interface RouteContext {
  params: Promise<{ role: string }>;
}

function isBriefingRole(value: string): value is BriefingRole {
  return BRIEFING_ROLES.includes(value as BriefingRole);
}

function toPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  const rateLimit = consumeRateLimit("briefing", auth.token.uid);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded for briefing history reads." },
      {
        status: 429,
        headers: {
          "retry-after": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  const { role } = await context.params;
  if (!isBriefingRole(role)) {
    return NextResponse.json(
      { error: `Unsupported role "${role}".`, validRoles: BRIEFING_ROLES },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const days = Math.min(toPositiveInt(url.searchParams.get("days"), 7), 30);
  const limit = Math.min(toPositiveInt(url.searchParams.get("limit"), days), 30);
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [history, compare] = await Promise.all([
      getBriefingsByRole(role, { sinceIso, limit }),
      (async () => {
        const compareRole = url.searchParams.get("compareRole");
        if (!compareRole || !isBriefingRole(compareRole) || compareRole === role) {
          return [];
        }
        return getBriefingsByRole(compareRole, { sinceIso, limit });
      })(),
    ]);

    return NextResponse.json(
      {
        role,
        days,
        history: history.map((item) => ({
          id: item.id,
          role: item.role,
          generatedAt: item.generatedAt,
          date: item.date,
          sections: item.sections,
          sources: item.sources,
        })),
        compare,
      },
      { headers: { "x-petrosignal-runtime-mode": "live-firestore" } },
    );
  } catch (error) {
    captureException(error, {
      route: "/api/briefing/[role]/history",
      component: "briefing-history-route",
      details: { role },
    });
    return NextResponse.json(
      {
        role,
        days,
        history: [],
        compare: [],
      },
      { headers: { "x-petrosignal-runtime-mode": "fallback-mock" } },
    );
  }
}
