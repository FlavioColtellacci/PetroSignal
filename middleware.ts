import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const AUTH_COOKIE_NAME = "ps_auth_token"

const PROTECTED_API_PREFIXES = [
  "/api/alerts",
  "/api/news",
  "/api/metrics",
  "/api/agents/status",
  "/api/briefing",
  "/api/preferences",
] as const

function hasAuthCookie(request: NextRequest) {
  return Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value)
}

export function middleware(request: NextRequest) {
  if (hasAuthCookie(request)) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  const isApiPath = PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isApiPath) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/alerts/:path*",
    "/news/:path*",
    "/settings/:path*",
    "/api/alerts/:path*",
    "/api/news/:path*",
    "/api/metrics/:path*",
    "/api/agents/status/:path*",
    "/api/briefing/:path*",
    "/api/preferences/:path*",
  ],
}
