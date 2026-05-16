import { NextResponse } from "next/server";

import { getBriefingShareById } from "@/lib/repositories/briefing-shares-repository";
import { getBriefingById, getLatestBriefingByRole } from "@/lib/repositories/briefings-repository";
import { getMockBriefing } from "@/lib/mock-data";

interface RouteContext {
  params: Promise<{ shareId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { shareId } = await context.params;
  const share = await getBriefingShareById(shareId);
  if (!share) {
    return NextResponse.json({ error: "Share link not found." }, { status: 404 });
  }

  if (Date.parse(share.expiresAt) < Date.now()) {
    return NextResponse.json({ error: "Share link has expired." }, { status: 410 });
  }

  let briefing = await getBriefingById(share.briefingId);
  if (!briefing) {
    briefing = await getLatestBriefingByRole(share.role);
  }

  const document = briefing ?? {
    id: `mock-${share.role}`,
    ...getMockBriefing(share.role),
  };

  return NextResponse.json({
    shareId: share.id,
    role: share.role,
    expiresAt: share.expiresAt,
    briefing: {
      id: document.id,
      role: document.role,
      date: document.date,
      generatedAt: document.generatedAt,
      sections: document.sections,
      sources: document.sources,
    },
  });
}
