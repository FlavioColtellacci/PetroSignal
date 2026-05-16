import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";

import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

const AUTH_COOKIE_NAME = "ps_auth_token";

function readCookieValue(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const chunk of cookieHeader.split(";")) {
    const [rawName, ...valueParts] = chunk.trim().split("=");
    if (rawName !== key) {
      continue;
    }
    const value = valueParts.join("=");
    return value ? decodeURIComponent(value) : null;
  }

  return null;
}

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return readCookieValue(request.headers.get("cookie"), AUTH_COOKIE_NAME);
}

type AuthResult =
  | { ok: true; token: DecodedIdToken }
  | { ok: false; response: NextResponse };

export async function requireAuthenticatedRequest(
  request: Request,
): Promise<AuthResult> {
  const idToken = readBearerToken(request);
  if (!idToken) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const adminAuth = getFirebaseAdminAuth();
  if (!adminAuth) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Firebase admin auth is not configured." },
        { status: 503 },
      ),
    };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { ok: true, token: decoded };
  } catch (error) {
    console.error("Failed Firebase token verification.", error);
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }
}
