import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthenticatedRequest } from "@/lib/api-auth";
import {
  DEFAULT_USER_PREFERENCES,
  getUserPreferences,
  saveUserPreferences,
  withDefaultUserPreferences,
} from "@/lib/repositories/user-preferences-repository";
import { BRIEFING_ROLES } from "@/types/domain";

const roleSchema = z.enum(BRIEFING_ROLES);
const preferencesSchema = z.object({
  defaultRole: roleSchema,
  timezone: z.string().min(2).max(120),
  onboardingCompleted: z.boolean(),
  dashboard: z.object({
    role: roleSchema,
  }),
  alerts: z.object({
    severityFilter: z.enum(["all", "high", "medium", "low"]),
    windowFilter: z.enum(["24h", "7d", "30d"]),
    sortOrder: z.enum(["newest", "oldest"]),
  }),
  news: z.object({
    sourceFilter: z.string().min(1).max(120),
    agentFilter: z.string().min(1).max(120),
    roleFocus: roleSchema,
  }),
});

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const saved = await getUserPreferences(auth.token.uid);
    if (!saved) {
      return NextResponse.json(DEFAULT_USER_PREFERENCES);
    }
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Failed to read user preferences from Firestore.", error);
    return NextResponse.json(DEFAULT_USER_PREFERENCES, { status: 200 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = preferencesSchema.parse(body);
    const preferences = withDefaultUserPreferences(parsed);
    const saved = await saveUserPreferences(auth.token.uid, preferences);
    if (!saved) {
      return NextResponse.json(
        { error: "Preferences persistence unavailable." },
        { status: 503 },
      );
    }
    return NextResponse.json(preferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid preferences payload.",
          details: error.issues,
        },
        { status: 400 },
      );
    }
    console.error("Failed to persist user preferences.", error);
    return NextResponse.json({ error: "Unable to save preferences." }, { status: 500 });
  }
}
