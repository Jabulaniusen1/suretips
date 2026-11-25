import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Cron routes require `Authorization: Bearer <CRON_SECRET>`. Vercel Cron sends
 * this header automatically when CRON_SECRET is set in the project. Fails
 * closed when the secret is missing, and compares in constant time.
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
