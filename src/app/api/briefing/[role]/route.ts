import { NextResponse } from "next/server";

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

export async function GET(_: Request, context: RouteContext) {
  const { role } = await context.params;

  if (!isBriefingRole(role)) {
    return NextResponse.json(
      {
        error: `Unsupported role "${role}".`,
        validRoles: BRIEFING_ROLES,
      },
      { status: 400 },
    );
  }

  try {
    const firestoreBriefing = await getLatestBriefingByRole(role);
    if (firestoreBriefing) {
      return NextResponse.json(toBriefingDocument(firestoreBriefing));
    }
  } catch (error) {
    console.error("Failed to read briefing from Firestore, falling back to mock.", error);
  }

  return NextResponse.json(getMockBriefing(role));
}
