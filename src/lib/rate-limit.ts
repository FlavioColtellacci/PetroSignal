type RateLimitScope = "news" | "alerts" | "metrics" | "briefing";

type RateLimitRule = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const DEFAULT_RULES: Record<RateLimitScope, RateLimitRule> = {
  news: { limit: 120, windowMs: 60_000 },
  alerts: { limit: 120, windowMs: 60_000 },
  metrics: { limit: 120, windowMs: 60_000 },
  briefing: { limit: 90, windowMs: 60_000 },
};

const buckets = new Map<string, Bucket>();

function readInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function readRule(scope: RateLimitScope): RateLimitRule {
  const prefix = `API_RATE_LIMIT_${scope.toUpperCase()}`;
  return {
    limit: readInt(process.env[`${prefix}_LIMIT`], DEFAULT_RULES[scope].limit),
    windowMs: readInt(process.env[`${prefix}_WINDOW_MS`], DEFAULT_RULES[scope].windowMs),
  };
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; remaining: 0; resetAt: number };

export function consumeRateLimit(scope: RateLimitScope, key: string): RateLimitResult {
  const now = Date.now();
  const rule = readRule(scope);
  const bucketKey = `${scope}:${key}`;
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + rule.windowMs;
    buckets.set(bucketKey, { count: 1, resetAt });
    return { ok: true, remaining: Math.max(rule.limit - 1, 0), resetAt };
  }

  if (existing.count >= rule.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(bucketKey, existing);
  return { ok: true, remaining: Math.max(rule.limit - existing.count, 0), resetAt: existing.resetAt };
}
