import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import {
  FINISHED_STATUSES,
  LIVE_STATUSES,
  VOID_STATUSES,
  getFixturesByIds,
  regularTimeScore,
  type FixtureSummary,
} from "@/lib/football-api";
import { gradePrediction } from "@/lib/utils/prediction-grading";
import type { Tables } from "@/types/database";

type PredictionUpdate = Partial<Tables<"predictions">>;

/** Predictions checked per run. Fixtures are fetched 20 per API call. */
const MAX_PREDICTIONS_PER_RUN = 300;

/** Stop chasing fixtures that never reported a final score. */
const LOOKBACK_DAYS = 7;

export interface UpdateScoresResult {
  checked: number;
  fixtures: number;
  updated: number;
  graded: number;
  voided: number;
  /** Graded results approved for the public record (including any backlog). */
  approved: number;
  errors: string[];
}

/**
 * Updates live/final scores and auto-grades finished predictions.
 *
 * Results are approved automatically when they are graded: the admin Results
 * page (manual review) is hidden from the sidebar, and public statistics only
 * count approved results. Picks that can't be graded from the score (bespoke
 * markets) stay pending. A result an admin has already set by hand is never
 * overwritten.
 */
export async function updateScores(): Promise<UpdateScoresResult> {
  const supabase = createServiceClient();
  const now = new Date();
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const result: UpdateScoresResult = { checked: 0, fixtures: 0, updated: 0, graded: 0, voided: 0, approved: 0, errors: [] };
  result.approved += await approveGradedBacklog(supabase, result.errors);

  // Most recent first, so a backlog of stale (e.g. postponed) fixtures can't
  // starve today's matches of updates.
  const { data: predictions, error } = await supabase
    .from("predictions")
    .select("*")
    .neq("status", "finished")
    .not("external_fixture_id", "is", null)
    .lte("kickoff_time", now.toISOString())
    .gte("kickoff_time", since.toISOString())
    .order("kickoff_time", { ascending: false })
    .limit(MAX_PREDICTIONS_PER_RUN);

  if (error) {
    result.errors.push(`Could not load predictions: ${error.message}`);
    return result;
  }
  if (!predictions?.length) return result;

  result.checked = predictions.length;
  const fixtureIds = [...new Set(predictions.map((p) => p.external_fixture_id!))];

  let fixtures: FixtureSummary[];
  try {
    fixtures = await getFixturesByIds(fixtureIds);
  } catch (err) {
    // Leave every prediction untouched -- a failed API call is not a result.
    result.errors.push(err instanceof Error ? err.message : String(err));
    return result;
  }

  result.fixtures = fixtures.length;
  const byId = new Map(fixtures.map((f) => [f.fixture.id, f]));

  for (const prediction of predictions) {
    const fixture = byId.get(prediction.external_fixture_id!);
    if (!fixture) continue; // not returned -- try again next run

    const update = buildUpdate(prediction, fixture);
    if (!update) continue;

    const { error: updateError } = await supabase.from("predictions").update(update).eq("id", prediction.id);
    if (updateError) {
      result.errors.push(`${prediction.id}: ${updateError.message}`);
      continue;
    }
    result.updated += 1;
    if (update.result === "win" || update.result === "loss") result.graded += 1;
    if (update.result === "push" && VOID_STATUSES.has(fixture.fixture.status.short)) result.voided += 1;
    if (update.result_approved) result.approved += 1;
  }

  return result;
}

/**
 * Approves results that are already graded but were never approved (graded
 * before auto-approval existed, or set by hand on the hidden admin pages), so
 * nothing waits on a Results page that is no longer in the sidebar.
 */
async function approveGradedBacklog(supabase: ReturnType<typeof createServiceClient>, errors: string[]): Promise<number> {
  const { data, error } = await supabase
    .from("predictions")
    .update({ result_approved: true })
    .eq("result_approved", false)
    .neq("result", "pending")
    .select("id");
  if (error) {
    errors.push(`Could not approve graded results: ${error.message}`);
    return 0;
  }
  return data?.length ?? 0;
}

function buildUpdate(prediction: Tables<"predictions">, fixture: FixtureSummary): PredictionUpdate | null {
  const statusShort = fixture.fixture.status.short;
  const update: PredictionUpdate = {};

  // Postponed / rescheduled: follow the new kickoff time.
  if (fixture.fixture.date && new Date(fixture.fixture.date).getTime() !== new Date(prediction.kickoff_time).getTime()) {
    update.kickoff_time = fixture.fixture.date;
  }

  if (VOID_STATUSES.has(statusShort)) {
    update.status = "finished";
    if (prediction.result === "pending") {
      update.result = "push";
      update.result_approved = true; // auto-approved: no manual Results review
      update.admin_notes = [prediction.admin_notes, `Void: fixture status ${statusShort}.`].filter(Boolean).join(" ");
    }
    return update;
  }

  if (LIVE_STATUSES.has(statusShort)) {
    update.status = "live";
    update.home_score = fixture.goals.home;
    update.away_score = fixture.goals.away;
    return update;
  }

  if (FINISHED_STATUSES.has(statusShort)) {
    const score = regularTimeScore(fixture);
    update.status = "finished";
    update.home_score = score.home;
    update.away_score = score.away;
    if (prediction.result === "pending" && score.home !== null && score.away !== null) {
      // Grade the pick as published (frozen at kickoff) -- that's what the public record shows.
      const graded = gradePrediction(prediction.original_prediction_type || prediction.prediction_type, score.home, score.away);
      if (graded) {
        update.result = graded;
        update.result_approved = true; // auto-approved: no manual Results review
      }
    }
    return update;
  }

  return Object.keys(update).length > 0 ? update : null;
}
