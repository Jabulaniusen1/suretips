import "server-only";

// Best-effort fixed-window limiter. State lives in the memory of one server
// instance, so on serverless hosting it only slows down bursts that hit the
// same instance -- enough to blunt casual spam on low-value endpoints. Use a
// shared store (e.g. Vercel KV / Upstash) if stronger guarantees are needed.

const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 10_000;

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      if (buckets.size >= MAX_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  return { ok: bucket.count <= limit, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
