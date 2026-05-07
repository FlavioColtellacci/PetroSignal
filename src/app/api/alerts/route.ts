import { NextResponse } from "next/server";

import { getRecentAlerts } from "@/lib/repositories/alerts-repository";
import { getMockAlerts } from "@/lib/mock-data";

export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const alerts = await getRecentAlerts(since, 50);
    if (alerts.length > 0) {
      return NextResponse.json(alerts);
    }
  } catch (error) {
    console.error("Failed to read alerts from Firestore, falling back to mock.", error);
  }

  return NextResponse.json(getMockAlerts());
}
