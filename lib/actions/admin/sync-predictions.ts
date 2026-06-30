"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";
import { getFixturesByDateRange, getOdds } from "@/lib/football-api";
import { sortFixturesByNotability } from "@/lib/utils/fixture-priority";

interface BookmakerOdds {
  bookmakers: Array<{
    bets: Array<{ name: string; values: Array<{ value: string; odd: string }> }>;
  }>;
}

export async function syncPredictionsFromApi(input: {
  planId: string;
  leagueId?: number;
  date: string;
  minOdds: number;
  maxOdds: number;
  defaultConfidence: number;
  maxCount: number;
}) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const fixtures = await getFixturesByDateRange(input.date, input.date, input.leagueId);
  const supabase = await createClient();

  // Scan a much wider, notability-sorted pool than maxCount*3 -- the API's
  // raw fixture order is unsorted and dominated by odds-sparse lower/youth
  // leagues, so a small unsorted slice frequently found nothing even when
  // plenty of usable fixtures existed later in the list.
  const candidates = sortFixturesByNotability(fixtures).slice(0, Math.max(60, input.maxCount * 10));

  // Re-running a sync for the same plan/date previously inserted duplicate
  // rows every time -- skip fixtures already synced into this plan.
  const { data: alreadySynced } = await supabase
    .from("predictions")
    .select("external_fixture_id")
    .eq("plan_id", input.planId)
    .not("external_fixture_id", "is", null);
  const existingFixtureIds = new Set((alreadySynced ?? []).map((r) => r.external_fixture_id));

  let inserted = 0;
  let checked = 0;
  let withOdds = 0;
  let skipped = 0;
  for (const fixture of candidates) {
    if (inserted >= input.maxCount) break;
    if (existingFixtureIds.has(fixture.fixture.id)) {
      skipped += 1;
      continue;
    }
    checked += 1;

    const odds = await getOdds(fixture.fixture.id);
    const matchWinner = (odds as BookmakerOdds[] | null)?.[0]?.bookmakers?.[0]?.bets?.find(
      (bet) => bet.name === "Match Winner"
    );

    if (!matchWinner) continue;
    withOdds += 1;

    const best = matchWinner.values
      .map((v) => ({ ...v, odd: Number(v.odd) }))
      .sort((a, b) => a.odd - b.odd)[0];

    if (!best || best.odd < input.minOdds || best.odd > input.maxOdds) continue;

    const predictionType = best.value === "Home" ? "Home Win" : best.value === "Away" ? "Away Win" : "Draw";

    const { error } = await supabase.from("predictions").insert({
      plan_id: input.planId,
      home_team: fixture.teams.home.name,
      away_team: fixture.teams.away.name,
      league: fixture.league.name,
      league_id: fixture.league.id,
      external_fixture_id: fixture.fixture.id,
      home_team_logo: fixture.teams.home.logo,
      away_team_logo: fixture.teams.away.logo,
      prediction_type: predictionType,
      odds: best.odd,
      confidence: input.defaultConfidence,
      kickoff_time: fixture.fixture.date,
      admin_notes: `Auto-synced from API-Sports fixture #${fixture.fixture.id}. Review before publishing.`,
    });

    if (!error) inserted += 1;
  }

  revalidatePath("/admin/predictions");
  return { inserted, scanned: fixtures.length, checked, withOdds, skipped };
}
