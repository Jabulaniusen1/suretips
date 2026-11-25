import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { ResultSummary } from "@/lib/predictions/stats";
import type { MarketKey } from "@/lib/predictions/markets";
import { DISABLED_MARKETS, isMarketEnabled, isMarketKey } from "@/lib/predictions/markets";
import { enabledMarketsOnly } from "@/lib/data/predictions";
import { lagosDayRange } from "@/lib/utils/date";
import type { PublicPrediction } from "@/lib/data/predictions";

const DAY_MS = 24 * 60 * 60 * 1000;

type SummaryRow = { total: number; wins: number; losses: number; pushes: number; pending: number; awaiting_verification: number };

function toSummary(row: SummaryRow | undefined): ResultSummary {
  const wins = Number(row?.wins ?? 0);
  const losses = Number(row?.losses ?? 0);
  const pushes = Number(row?.pushes ?? 0);
  const decided = wins + losses;
  return {
    total: Number(row?.total ?? 0),
    wins,
    losses,
    pushes,
    pending: Number(row?.pending ?? 0),
    awaitingVerification: Number(row?.awaiting_verification ?? 0),
    settled: decided + pushes,
    winRate: decided > 0 ? Math.round((wins / decided) * 1000) / 10 : null,
  };
}

export interface SummaryFilter {
  fromIso?: string | null;
  toIso?: string | null;
  market?: MarketKey | null;
  leagueId?: number | null;
}

async function summaryRow(filter: SummaryFilter, market: MarketKey | null): Promise<SummaryRow | null> {
  const { data, error } = await createPublicClient().rpc("prediction_result_summary", {
    p_from: filter.fromIso ?? null,
    p_to: filter.toIso ?? new Date().toISOString(),
    p_market: market,
    p_league_id: filter.leagueId ?? null,
  });
  if (error) {
    console.error(`[results] summary: ${error.message}`);
    return null;
  }
  return data?.[0] ?? null;
}

const SUMMARY_FIELDS = ["total", "wins", "losses", "pushes", "pending", "awaiting_verification"] as const;

/** Aggregate performance for already-kicked-off predictions in a window. */
export const getResultSummary = cache(async (filter: SummaryFilter = {}): Promise<ResultSummary | null> => {
  if (filter.market && !isMarketEnabled(filter.market)) return toSummary(undefined);
  const row = await summaryRow(filter, filter.market ?? null);
  if (!row) return null;
  if (filter.market || DISABLED_MARKETS.size === 0) return toSummary(row);

  // DISABLED (correct score): the SQL aggregate covers every market, so take
  // switched-off markets back out of the all-markets totals.
  const disabled = await Promise.all([...DISABLED_MARKETS].map((m) => summaryRow(filter, m)));
  if (disabled.some((d) => d === null)) return null;
  const net = { ...row };
  for (const d of disabled) for (const k of SUMMARY_FIELDS) net[k] = Number(net[k] ?? 0) - Number(d![k] ?? 0);
  return toSummary(net);
});

/** Last 7 days, last 30 days and all time, for an optional market/league. */
export const getResultWindows = cache(async (market?: MarketKey | null, leagueId?: number | null) => {
  const now = Date.now();
  const toIso = new Date(now).toISOString();
  const [last7, last30, allTime] = await Promise.all([
    getResultSummary({ fromIso: new Date(now - 7 * DAY_MS).toISOString(), toIso, market, leagueId }),
    getResultSummary({ fromIso: new Date(now - 30 * DAY_MS).toISOString(), toIso, market, leagueId }),
    getResultSummary({ toIso, market, leagueId }),
  ]);
  return { last7, last30, allTime };
});

export const getMarketBreakdown = cache(async (days = 90): Promise<Array<{ market: MarketKey; summary: ResultSummary }>> => {
  const now = Date.now();
  const { data, error } = await createPublicClient().rpc("prediction_result_summary_by_market", {
    p_from: new Date(now - days * DAY_MS).toISOString(),
    p_to: new Date(now).toISOString(),
  });
  if (error) {
    console.error(`[results] by market: ${error.message}`);
    return [];
  }
  return (data ?? [])
    // DISABLED (correct score): switched-off markets are left out of the breakdown.
    .filter((row) => isMarketKey(row.market) && isMarketEnabled(row.market))
    .map((row) => ({ market: row.market as MarketKey, summary: toSummary({ ...row, awaiting_verification: 0 }) }));
});

export const getResultLeagues = cache(async (): Promise<Array<{ leagueId: number; league: string; settled: number }>> => {
  const { data, error } = await createPublicClient().rpc("prediction_result_leagues");
  if (error) {
    console.error(`[results] leagues: ${error.message}`);
    return [];
  }
  return (data ?? []).map((r) => ({ leagueId: r.league_id, league: r.league, settled: Number(r.settled) }));
});

export interface VerifiedResultsQuery {
  dateKey?: string | null;
  market?: MarketKey | null;
  leagueId?: number | null;
  result?: "win" | "loss" | "push" | null;
  page: number;
  pageSize: number;
}

const RESULT_COLUMNS =
  "id, home_team, away_team, league, league_id, external_fixture_id, home_team_logo, away_team_logo, prediction_type, market, odds, confidence, kickoff_time, status, result, result_approved, result_approved_at, source, home_score, away_score, analysis, original_prediction_type, original_odds, published_at, created_at, updated_at";

/** Verified (approved) results, newest first, with exact total count. */
export async function getVerifiedResults(q: VerifiedResultsQuery): Promise<{ rows: PublicPrediction[]; total: number; failed: boolean }> {
  let query = enabledMarketsOnly(createPublicClient().from("predictions").select(RESULT_COLUMNS, { count: "exact" }))
    .eq("result_approved", true)
    .neq("result", "pending")
    .order("kickoff_time", { ascending: false })
    .range((q.page - 1) * q.pageSize, q.page * q.pageSize - 1);

  if (q.dateKey) {
    const { from, to } = lagosDayRange(q.dateKey);
    query = query.gte("kickoff_time", from).lte("kickoff_time", to);
  }
  if (q.market) query = query.eq("market", q.market);
  if (q.leagueId) query = query.eq("league_id", q.leagueId);
  if (q.result) query = query.eq("result", q.result);

  const { data, count, error } = await query;
  if (error) {
    console.error(`[results] verified list: ${error.message}`);
    return { rows: [], total: 0, failed: true };
  }
  return { rows: (data ?? []) as PublicPrediction[], total: count ?? 0, failed: false };
}
