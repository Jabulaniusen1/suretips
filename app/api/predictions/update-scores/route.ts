import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { createServiceClient } from "@/lib/supabase/service";
import { getFixtureById } from "@/lib/football-api";
import { gradePrediction } from "@/lib/utils/prediction-grading";
import type { Tables } from "@/types/database";

type PredictionUpdate = Partial<Tables<"predictions">>;

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE"]);

// Caps API-Sports calls per run -- this route hits getFixtureById once per
// pending prediction with no other throttling, and runs every 15 min, so an
// unbounded backlog could burn through a plan's daily request quota fast.
const MAX_PER_RUN = 40;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .neq("status", "finished")
    .not("external_fixture_id", "is", null)
    .lte("kickoff_time", new Date().toISOString())
    .order("kickoff_time", { ascending: true })
    .limit(MAX_PER_RUN);

  let updated = 0;
  let graded = 0;

  for (const prediction of predictions ?? []) {
    if (!prediction.external_fixture_id) continue;

    const fixture = await getFixtureById(prediction.external_fixture_id);
    if (!fixture) continue;

    const statusShort = fixture.fixture.status.short;
    const homeScore = fixture.goals.home;
    const awayScore = fixture.goals.away;

    let status: "not_started" | "live" | "finished" = prediction.status;
    if (FINISHED_STATUSES.has(statusShort)) status = "finished";
    else if (LIVE_STATUSES.has(statusShort)) status = "live";

    const update: PredictionUpdate = { status, home_score: homeScore, away_score: awayScore };

    if (status === "finished" && homeScore !== null && awayScore !== null) {
      const result = gradePrediction(prediction.prediction_type, homeScore, awayScore);
      if (result) {
        update.result = result;
        graded += 1;
      }
    }

    const { error } = await supabase.from("predictions").update(update).eq("id", prediction.id);
    if (!error) updated += 1;
  }

  return NextResponse.json({ updated, graded });
}
