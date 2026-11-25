"use server";

import { toActionResult } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";
import { getFixturesByDate, getLeagueFixtures, getOdds, seasonForDate } from "@/lib/football-api";
import { sortFixturesByNotability } from "@/lib/utils/fixture-priority";
import { impliedProbability, mergeBookmakerBets } from "@/lib/predictions/pick-selection";
import { lagosDayRange, parseDateKey } from "@/lib/utils/date";

/**
 * Manual "match result" sync: backs the favourite of each fixture on a date
 * (optionally one league) when its price sits inside the chosen odds range.
 * Skips fixtures that already have a match-result pick.
 */
async function syncPredictionsFromApiImpl(input: { leagueId?: number; date: string; minOdds: number; maxOdds: number; maxCount: number }) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const dateKey = parseDateKey(input.date);
  if (!dateKey) throw new Error("Invalid date");
  const maxCount = Math.min(50, Math.max(1, Math.floor(input.maxCount)));
  if (!(input.minOdds >= 1.01 && input.maxOdds <= 20 && input.minOdds <= input.maxOdds)) throw new Error("Invalid odds range");

  const fixtures = input.leagueId
    ? await getLeagueFixtures(input.leagueId, seasonForDate(new Date(`${dateKey}T12:00:00Z`), input.leagueId), dateKey, dateKey)
    : await getFixturesByDate(dateKey);
  const supabase = await createClient();

  const { from, to } = lagosDayRange(dateKey);
  const { data: existing, error: existingError } = await supabase
    .from("predictions")
    .select("external_fixture_id, market")
    .gte("kickoff_time", from)
    .lte("kickoff_time", to)
    .in("market", ["home_win", "away_win", "draw"]);
  if (existingError) throw new Error(existingError.message);
  const covered = new Set((existing ?? []).map((r) => r.external_fixture_id));

  const candidates = sortFixturesByNotability(fixtures.filter((f) => f.fixture.status.short === "NS")).slice(0, Math.max(60, maxCount * 10));

  let inserted = 0;
  let checked = 0;
  let withOdds = 0;
  let skipped = 0;
  for (const fixture of candidates) {
    if (inserted >= maxCount) break;
    if (covered.has(fixture.fixture.id)) {
      skipped += 1;
      continue;
    }
    checked += 1;

    const odds = await getOdds(fixture.fixture.id);
    const matchWinner = mergeBookmakerBets(odds[0]?.bookmakers ?? [], Number(process.env.API_FOOTBALL_BOOKMAKER_ID) || null).find(
      (bet) => bet.name === "Match Winner"
    );
    if (!matchWinner) continue;
    withOdds += 1;

    const best = matchWinner.values.map((v) => ({ ...v, odd: Number(v.odd) })).sort((a, b) => a.odd - b.odd)[0];
    if (!best || best.odd < input.minOdds || best.odd > input.maxOdds) continue;

    const predictionType = best.value === "Home" ? "Home Win" : best.value === "Away" ? "Away Win" : "Draw";
    const { error } = await supabase.from("predictions").insert({
      home_team: fixture.teams.home.name,
      away_team: fixture.teams.away.name,
      league: fixture.league.name,
      league_id: fixture.league.id,
      external_fixture_id: fixture.fixture.id,
      home_team_logo: fixture.teams.home.logo,
      away_team_logo: fixture.teams.away.logo,
      prediction_type: predictionType,
      odds: best.odd,
      confidence: impliedProbability(best.odd),
      kickoff_time: fixture.fixture.date,
      source: "api_sync",
      admin_notes: `Admin sync (match result) from API-Sports fixture #${fixture.fixture.id}.`,
    });
    if (!error) inserted += 1;
    else if (error.code !== "23505") throw new Error(error.message);
  }

  revalidatePath("/admin/predictions");
  revalidatePath("/", "layout");
  return { inserted, scanned: fixtures.length, checked, withOdds, skipped };
}

// Exported actions return { ok, data | error } -- see lib/actions/result.ts.
export async function syncPredictionsFromApi(...args: Parameters<typeof syncPredictionsFromApiImpl>) {
  return toActionResult(() => syncPredictionsFromApiImpl(...args));
}
