import { NextResponse } from "next/server";

import { getMockMetrics } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json(getMockMetrics());
}
