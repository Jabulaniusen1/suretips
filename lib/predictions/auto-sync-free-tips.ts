import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { FootballApiError, getFixturesByDate, getOdds } from "@/lib/football-api";
import { sortFixturesByNotability } from "@/lib/utils/fixture-priority";
import { lagosDayRange } from "@/lib/utils/date";
import { MARKET_KEYS, marketOf, type MarketKey } from "@/lib/predictions/markets";
import { mergeBookmakerBets, selectPicksFromOdds } from "@/lib/predictions/pick-selection";
import type { Database } from "@/types/database";

type PredictionInsert = Database["public"]["Tables"]["predictions"]["Insert"];

/** Markets the automatic sync fills. Correct scores are editorial-only. */
const AUTO_MARKETS = MARKET_KEYS.filter((m) => m !== "correct_score");

/** Target number of picks per market per day. */
const TARGET_PER_MARKET = 10;

/** Max fixtures scanned per day per run -- each costs one /odds API call. */
const MAX_FIXTURE_SCAN = 60;

/** Don't publish picks for matches kicking off within this window. */
const MIN_LEAD_TIME_MS = 15 * 60 * 1000;

/** Stop scanning after this many consecutive odds-request failures. */
const MAX_CONSECUTIVE_FAILURES = 5;

/**
 * Minimum gap between odds requests, to stay under API-Sports per-minute
 * limits (plans range from 10 to 1,200+ requests/minute). 250 ms caps a run
 * at 240 requests/minute; raise it for smaller plans.
 */
const ODDS_REQUEST_INTERVAL_MS = Math.max(0, Number(process.env.API_FOOTBALL_MIN_INTERVAL_MS ?? 250) || 0);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface SyncDayResult {
  date: string;
  status: "ok" | "covered" | "no_fixtures" | "partial" | "error";
  inserted: number;
  scanned: number;
  byMarket: Partial<Record<MarketKey, number>>;
  error?: string;
}

/**
 * Tops up automatically generated free picks for one Lagos calendar day.
 *
 * Never deletes or edits existing predictions, so a failed or partial run
 * (API outage, quota exhausted) leaves previously published picks intact.
 * API failures are reported as errors -- never as "no fixtures".
 */
export async function autoSyncFreeTips(dateKey: string): Promise<SyncDayResult> {
  const base = { date: dateKey, inserted: 0, scanned: 0, byMarket: {} };
  const supabase = createServiceClient();
  const { from, to } = lagosDayRange(dateKey);

  const { data: existing, error: existingError } = await supabase
    .from("predictions")
    .select("external_fixture_id, prediction_type, market")
    .gte("kickoff_time", from)
    .lte("kickoff_time", to);

  if (existingError) {
    return { ...base, status: "error", error: `Could not read existing predictions: ${existingError.message}` };
  }

  const counts = Object.fromEntries(AUTO_MARKETS.map((m) => [m, 0])) as Record<MarketKey, number>;
  const taken = new Set<string>();
  // Fixtures already processed by an earlier run (or picked by an editor).
  // Their odds were already evaluated, so re-scanning them would only spend
  // API quota -- every 4-hourly run would otherwise re-check the same matches.
  const processedFixtures = new Set<number>();
  for (const row of existing ?? []) {
    if (row.external_fixture_id) processedFixtures.add(row.external_fixture_id);
    const market = marketOf(row);
    if (!market) continue;
    counts[market] = (counts[market] ?? 0) + 1;
    if (row.external_fixture_id) taken.add(`${row.external_fixture_id}:${market}`);
  }

  const marketFull = (m: MarketKey) => (counts[m] ?? 0) >= TARGET_PER_MARKET;
  if (AUTO_MARKETS.every(marketFull)) return { ...base, status: "covered" };

  let fixtures;
  try {
    fixtures = await getFixturesByDate(dateKey);
  } catch (err) {
    return { ...base, status: "error", error: err instanceof Error ? err.message : String(err) };
  }

  const earliestKickoff = Date.now() + MIN_LEAD_TIME_MS;
  const candidates = sortFixturesByNotability(
    fixtures.filter(
      (f) => f.fixture.status.short === "NS" && new Date(f.fixture.date).getTime() > earliestKickoff && !processedFixtures.has(f.fixture.id)
    )
  ).slice(0, MAX_FIXTURE_SCAN);

  if (candidates.length === 0) return { ...base, status: "no_fixtures" };

  const rows: PredictionInsert[] = [];
  const byMarket: Partial<Record<MarketKey, number>> = {};
  let scanned = 0;
  let consecutiveFailures = 0;
  let stopReason: string | undefined;

  for (const fixture of candidates) {
    if (AUTO_MARKETS.every(marketFull)) break;

    let bets;
    try {
      if (scanned > 0 || consecutiveFailures > 0) await sleep(ODDS_REQUEST_INTERVAL_MS);
      const odds = await getOdds(fixture.fixture.id);
      bets = mergeBookmakerBets(odds[0]?.bookmakers ?? [], Number(process.env.API_FOOTBALL_BOOKMAKER_ID) || null);
      consecutiveFailures = 0;
    } catch (err) {
      if (err instanceof FootballApiError && (err.kind === "rate_limited" || err.kind === "not_configured")) {
        stopReason = err.message;
        break;
      }
      consecutiveFailures += 1;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        stopReason = `Stopped after ${consecutiveFailures} consecutive odds failures: ${err instanceof Error ? err.message : err}`;
        break;
      }
      continue;
    }
    scanned += 1;
    if (bets.length === 0) continue;

    for (const pick of selectPicksFromOdds(bets)) {
      const key = `${fixture.fixture.id}:${pick.market}`;
      if (taken.has(key) || marketFull(pick.market)) continue;
      taken.add(key);
      counts[pick.market] += 1;
      byMarket[pick.market] = (byMarket[pick.market] ?? 0) + 1;

      rows.push({
        home_team: fixture.teams.home.name,
        away_team: fixture.teams.away.name,
        league: fixture.league.name,
        league_id: fixture.league.id,
        external_fixture_id: fixture.fixture.id,
        home_team_logo: fixture.teams.home.logo,
        away_team_logo: fixture.teams.away.logo,
        kickoff_time: fixture.fixture.date,
        prediction_type: pick.predictionType,
        market: pick.market,
        odds: pick.odds,
        confidence: pick.confidence,
        source: "api_sync",
        admin_notes: `Auto-selected from bookmaker odds for API-Sports fixture #${fixture.fixture.id}.`,
      });
    }
  }

  const inserted = await insertSkippingDuplicates(supabase, rows);
  if (inserted.error) {
    return { ...base, scanned, byMarket, status: "error", inserted: inserted.count, error: inserted.error };
  }

  return {
    date: dateKey,
    status: stopReason ? "partial" : "ok",
    inserted: inserted.count,
    scanned,
    byMarket,
    ...(stopReason ? { error: stopReason } : {}),
  };
}

/**
 * Batch insert. If the batch hits the (fixture, market) unique index -- a
 * concurrent run or a manual pick added meanwhile -- fall back to row-by-row
 * inserts and skip the duplicates.
 */
async function insertSkippingDuplicates(
  supabase: ReturnType<typeof createServiceClient>,
  rows: PredictionInsert[]
): Promise<{ count: number; error?: string }> {
  if (rows.length === 0) return { count: 0 };

  const { error } = await supabase.from("predictions").insert(rows);
  if (!error) return { count: rows.length };
  if (error.code !== "23505") return { count: 0, error: error.message };

  let count = 0;
  for (const row of rows) {
    const { error: rowError } = await supabase.from("predictions").insert(row);
    if (!rowError) count += 1;
    else if (rowError.code !== "23505") return { count, error: rowError.message };
  }
  return { count };
}
