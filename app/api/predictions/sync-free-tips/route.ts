import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { autoSyncFreeTips } from "@/lib/predictions/auto-sync-free-tips";
import { addDaysToKey, lagosDateKey } from "@/lib/utils/date";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron: tops up free picks for today, tomorrow and the day after (Lagos
 * calendar days). Days run sequentially to stay within API-Sports per-minute
 * limits. Responds 502 if every day failed, so the failure shows up in the
 * cron logs instead of looking like a quiet day.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = lagosDateKey();
  const days = [today, addDaysToKey(today, 1), addDaysToKey(today, 2)];

  const results = [];
  for (const day of days) results.push(await autoSyncFreeTips(day));

  if (results.some((r) => r.inserted > 0)) revalidatePath("/", "layout");

  const allFailed = results.every((r) => r.status === "error");
  return NextResponse.json({ results }, { status: allFailed ? 502 : 200 });
}
