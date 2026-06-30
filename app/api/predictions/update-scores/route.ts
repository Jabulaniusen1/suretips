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

  const { data: ungradedEntries } = await supabase.from("free_games_entries").select("*").eq("graded", false);

  let freeGamesScored = 0;
  const fixtureOutcomeCache = new Map<string, "home" | "away" | "draw" | null>();

  for (const entry of ungradedEntries ?? []) {
    const pick = entry.prediction as { prediction_id?: string; choice?: string };
    if (!pick.prediction_id || !pick.choice) continue;

    if (!fixtureOutcomeCache.has(pick.prediction_id)) {
      const { data: fgPrediction } = await supabase
        .from("predictions")
        .select("status, external_fixture_id")
        .eq("id", pick.prediction_id)
        .maybeSingle();

      if (!fgPrediction || fgPrediction.status !== "finished" || !fgPrediction.external_fixture_id) {
        fixtureOutcomeCache.set(pick.prediction_id, null);
        continue;
      }

      const fixture = await getFixtureById(fgPrediction.external_fixture_id);
      if (!fixture || fixture.goals.home === null || fixture.goals.away === null) {
        fixtureOutcomeCache.set(pick.prediction_id, null);
        continue;
      }

      const outcome =
        fixture.goals.home > fixture.goals.away ? "home" : fixture.goals.away > fixture.goals.home ? "away" : "draw";
      fixtureOutcomeCache.set(pick.prediction_id, outcome);
    }

    const outcome = fixtureOutcomeCache.get(pick.prediction_id);
    if (outcome === null || outcome === undefined) continue;

    const points = pick.choice === outcome ? 10 : 0;
    await supabase.from("free_games_entries").update({ points_earned: points, graded: true }).eq("id", entry.id);
    freeGamesScored += 1;
  }

  return NextResponse.json({ updated, graded, freeGamesScored });
}
