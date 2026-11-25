import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { addDaysToKey, lagosDayRange } from "@/lib/utils/date";
import { ENABLED_MARKETS_FILTER, type MarketKey } from "@/lib/predictions/markets";
import type { Tables } from "@/types/database";

/** Columns safe to expose publicly -- never admin_notes or approver ids. */
const PUBLIC_COLUMNS =
  "id, home_team, away_team, league, league_id, external_fixture_id, home_team_logo, away_team_logo, prediction_type, market, odds, confidence, kickoff_time, status, result, result_approved, result_approved_at, source, home_score, away_score, analysis, original_prediction_type, original_odds, published_at, created_at, updated_at";

export type PublicPrediction = Omit<Tables<"predictions">, "admin_notes" | "result_approved_by">;

/** DISABLED (correct score): hides predictions in switched-off markets (see DISABLED_MARKETS). */
export function enabledMarketsOnly<Q extends { or(filters: string): Q }>(query: Q): Q {
  return ENABLED_MARKETS_FILTER ? query.or(ENABLED_MARKETS_FILTER) : query;
}

function logError(label: string, error: { message: string } | null) {
  if (error) console.error(`[predictions] ${label}: ${error.message}`);
}

/** Every published prediction kicking off on a Lagos calendar day. */
export const getPredictionsForDay = cache(async (dateKey: string): Promise<PublicPrediction[]> => {
  const { from, to } = lagosDayRange(dateKey);
  const { data, error } = await enabledMarketsOnly(createPublicClient().from("predictions").select(PUBLIC_COLUMNS))
    .gte("kickoff_time", from)
    .lte("kickoff_time", to)
    .order("kickoff_time")
    .limit(1000);
  logError(`day ${dateKey}`, error);
  return (data ?? []) as PublicPrediction[];
});

/** Predictions for `days` consecutive Lagos days starting at `startKey`. */
export const getPredictionsForDays = cache(async (startKey: string, days: number): Promise<PublicPrediction[]> => {
  const { from } = lagosDayRange(startKey);
  const { to } = lagosDayRange(addDaysToKey(startKey, days - 1));
  const { data, error } = await enabledMarketsOnly(createPublicClient().from("predictions").select(PUBLIC_COLUMNS))
    .gte("kickoff_time", from)
    .lte("kickoff_time", to)
    .order("kickoff_time")
    .limit(1000);
  logError(`days ${startKey}+${days}`, error);
  return (data ?? []) as PublicPrediction[];
});

export const getPredictionById = cache(async (id: string): Promise<PublicPrediction | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await enabledMarketsOnly(createPublicClient().from("predictions").select(PUBLIC_COLUMNS)).eq("id", id).maybeSingle();
  logError(`id ${id}`, error);
  return (data as PublicPrediction | null) ?? null;
});

/** All predictions published for one API fixture (one per market). */
export const getPredictionsByFixture = cache(async (fixtureId: number): Promise<PublicPrediction[]> => {
  const { data, error } = await enabledMarketsOnly(createPublicClient().from("predictions").select(PUBLIC_COLUMNS))
    .eq("external_fixture_id", fixtureId)
    .order("confidence", { ascending: false, nullsFirst: false });
  logError(`fixture ${fixtureId}`, error);
  return (data ?? []) as PublicPrediction[];
});

/** Upcoming predictions in one league, soonest first. */
export const getUpcomingLeaguePredictions = cache(async (leagueId: number, limit = 30): Promise<PublicPrediction[]> => {
  const { data, error } = await enabledMarketsOnly(createPublicClient().from("predictions").select(PUBLIC_COLUMNS))
    .eq("league_id", leagueId)
    .gte("kickoff_time", new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())
    .order("kickoff_time")
    .limit(limit);
  logError(`league ${leagueId} upcoming`, error);
  return (data ?? []) as PublicPrediction[];
});

/** Most recent verified results, optionally for one league or market. */
export const getRecentVerifiedResults = cache(
  async (options: { leagueId?: number; markets?: readonly MarketKey[]; limit?: number } = {}): Promise<PublicPrediction[]> => {
    let query = enabledMarketsOnly(createPublicClient().from("predictions").select(PUBLIC_COLUMNS))
      .eq("result_approved", true)
      .neq("result", "pending")
      .order("kickoff_time", { ascending: false })
      .limit(options.limit ?? 10);
    if (options.leagueId) query = query.eq("league_id", options.leagueId);
    if (options.markets?.length) query = query.in("market", [...options.markets]);
    const { data, error } = await query;
    logError("recent verified", error);
    return (data ?? []) as PublicPrediction[];
  }
);

/** Other fixtures with predictions on the same day in the same league. */
export const getRelatedFixturePredictions = cache(
  async (leagueId: number | null, kickoffIso: string, excludeFixtureId: number): Promise<PublicPrediction[]> => {
    if (!leagueId) return [];
    const kickoff = new Date(kickoffIso).getTime();
    const { data, error } = await enabledMarketsOnly(createPublicClient().from("predictions").select(PUBLIC_COLUMNS))
      .eq("league_id", leagueId)
      .neq("external_fixture_id", excludeFixtureId)
      .gte("kickoff_time", new Date(kickoff - 4 * 24 * 60 * 60 * 1000).toISOString())
      .lte("kickoff_time", new Date(kickoff + 4 * 24 * 60 * 60 * 1000).toISOString())
      .order("kickoff_time")
      .limit(40);
    logError("related fixtures", error);
    return (data ?? []) as PublicPrediction[];
  }
);
