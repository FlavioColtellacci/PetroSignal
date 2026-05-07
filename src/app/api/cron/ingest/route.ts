import { NextResponse } from "next/server"

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return false
  }

  const authHeader = request.headers.get("authorization")
  return authHeader === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 })
  }

  return NextResponse.json({
    status: "ok",
    message: "Ingestion cron placeholder reached.",
    nextStep: "Replace with live ingestion workers in Phase 2.",
  })
}
