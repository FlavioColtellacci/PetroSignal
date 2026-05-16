import { NextResponse } from "next/server";

import { requireAuthenticatedRequest } from "@/lib/api-auth";
import { captureException } from "@/lib/monitoring";
import { renderBriefingPdfBuffer } from "@/lib/render-briefing-pdf";
import { consumeRateLimit } from "@/lib/rate-limit";
import { writeAuditEvent } from "@/lib/repositories/audit-events-repository";
import { createBriefingShare } from "@/lib/repositories/briefing-shares-repository";
import { getLatestBriefingByRole } from "@/lib/repositories/briefings-repository";
import { getMockBriefing } from "@/lib/mock-data";
import { BRIEFING_ROLES, type BriefingRole } from "@/types/domain";

interface RouteContext {
  params: Promise<{ role: string }>;
}

function isBriefingRole(value: string): value is BriefingRole {
  return BRIEFING_ROLES.includes(value as BriefingRole);
}

function toSafeHours(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 24;
  }
  return Math.min(parsed, 7 * 24);
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
      { error: "Rate limit exceeded for briefing exports." },
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
  const requestPath = url.pathname;
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();
  const shareHours = toSafeHours(url.searchParams.get("shareHours"));
  if (format !== "json" && format !== "pdf") {
    return NextResponse.json(
      { error: 'Unsupported format. Use "json" or "pdf".' },
      { status: 400 },
    );
  }

  let briefing = null;
  try {
    briefing = await getLatestBriefingByRole(role);
  } catch (error) {
    captureException(error, {
      route: "/api/briefing/[role]/export",
      component: "briefing-export-route",
      details: { role },
    });
  }

  const document =
    briefing ??
    ({
      id: `mock-${role}`,
      ...getMockBriefing(role),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as const);

  const exportedAt = new Date().toISOString();
  const briefingPayload = {
    id: document.id,
    role: document.role,
    date: document.date,
    generatedAt: document.generatedAt,
    sections: document.sections,
    sources: document.sources,
  };

  async function logBriefingExport(mode: "live-firestore" | "fallback-mock") {
    try {
      await writeAuditEvent({
        userId,
        eventType: "briefing.export",
        path: requestPath,
        metadata: {
          role,
          format,
          mode,
        },
      });
    } catch (error) {
      captureException(error, {
        route: "/api/briefing/[role]/export",
        component: "audit-log-write",
        details: { role, format },
      });
    }
  }

  if (format === "pdf") {
    await logBriefingExport(briefing ? "live-firestore" : "fallback-mock");
    const pdfBuffer = await renderBriefingPdfBuffer(briefingPayload, exportedAt);
    const filename = `petrosignal-${role}-briefing-${briefingPayload.date}.pdf`;
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  let shareUrl: string | null = null;
  const share = await createBriefingShare({
    userId,
    role,
    briefingId: document.id,
    expiresInHours: shareHours,
  });
  if (share) {
    shareUrl = `${url.origin}/api/share/${share.id}`;
  }

  await logBriefingExport(briefing ? "live-firestore" : "fallback-mock");

  return NextResponse.json({
    exportedAt,
    role,
    format,
    data: briefingPayload,
    shareUrl,
    shareExpiresAt: share?.expiresAt ?? null,
  });
}
