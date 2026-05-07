import { NextResponse } from "next/server";

import { getMockAlerts } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json(getMockAlerts());
}
