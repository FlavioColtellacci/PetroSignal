import { NextResponse } from "next/server";

import { getMockBriefing } from "@/lib/mock-data";
import { BRIEFING_ROLES, type BriefingRole } from "@/types/domain";

function isBriefingRole(value: string): value is BriefingRole {
  return BRIEFING_ROLES.includes(value as BriefingRole);
}

interface RouteContext {
  params: Promise<{ role: string }>;
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

  return NextResponse.json(getMockBriefing(role));
}
