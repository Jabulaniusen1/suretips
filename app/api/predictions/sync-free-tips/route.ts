import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { autoSyncFreeTips } from "@/lib/predictions/auto-sync-free-tips";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sync tomorrow too, not just today, so users browsing ahead via the date
  // picker / Tomorrow tab see picks before the day actually arrives.
  const today = await autoSyncFreeTips(new Date());
  const tomorrow = await autoSyncFreeTips(addDays(new Date(), 1));

  return NextResponse.json({ today, tomorrow });
}
