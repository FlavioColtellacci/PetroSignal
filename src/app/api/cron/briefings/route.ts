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
    message: "Daily briefing cron placeholder reached.",
    nextStep: "Replace with MiniMax + Firestore briefing generation in Phase 2.",
  })
}
