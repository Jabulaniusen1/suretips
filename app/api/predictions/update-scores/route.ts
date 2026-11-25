import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { updateScores } from "@/lib/predictions/update-scores";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Cron: refreshes live/final scores and auto-grades finished picks. */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await updateScores();
  if (result.updated > 0) revalidatePath("/", "layout");

  const failed = result.errors.length > 0 && result.updated === 0 && result.checked > 0;
  return NextResponse.json(result, { status: failed ? 502 : 200 });
}
