import { NextResponse } from "next/server";

import { getMockNews } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json(getMockNews());
}
