import { NextResponse } from "next/server";

import { getMockAgentStatus } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json(getMockAgentStatus());
}
