import { startOfDay, endOfDay } from "date-fns";
import { createServiceClient } from "@/lib/supabase/service";
import { getFixturesByDateRange, getOdds } from "@/lib/football-api";
import { sortFixturesByNotability } from "@/lib/utils/fixture-priority";
import type { Database } from "@/types/database";

type PredictionInsert = Database["public"]["Tables"]["predictions"]["Insert"];

interface OddsValue {
  value: string;
  odd: string;
}
interface OddsBet {
  name: string;
  values: OddsValue[];
}
interface OddsResponse {
  bookmakers: Array<{ bets: OddsBet[] }>;
}

type Category = "home_win" | "away_win" | "btts" | "double_chance" | "over_1_5" | "over_2_5";

const CATEGORIES: Category[] = ["home_win", "away_win", "btts", "double_chance", "over_1_5", "over_2_5"];

function findBet(odds: OddsResponse[] | null, name: string): OddsBet | undefined {
  return odds?.[0]?.bookmakers?.[0]?.bets?.find((b) => b.name === name);
}

function valueOdd(bet: OddsBet | undefined, value: string): number | null {
  const match = bet?.values.find((v) => v.value === value);
  return match ? Number(match.odd) : null;
}

function confidenceFromOdds(odd: number): number {
  return Math.max(55, Math.min(92, Math.round(100 / odd) + 5));
}

/**
 * Idempotently tops up a given day's Free Tips (the `free-games` plan) with
 * one real, odds-backed pick per filter category (home win, away win, BTTS,
 * double chance, over 1.5, over 2.5), pulled from live API-Sports fixtures.
 * Safe to run repeatedly -- it only inserts categories not already covered
 * for that day. Defaults to today; the cron route also runs it for tomorrow
 * so picks are visible a day ahead instead of only appearing once "today"
 * catches up to them.
 */
export async function autoSyncFreeTips(targetDate: Date = new Date()) {
  const supabase = createServiceClient();

  const { data: plan } = await supabase.from("plans").select("id").eq("slug", "free-games").single();
  if (!plan) return { inserted: 0, reason: "free-games plan not found" };

  const from = startOfDay(targetDate).toISOString();
  const to = endOfDay(targetDate).toISOString();

  const { data: existing } = await supabase
    .from("predictions")
    .select("prediction_type")
    .eq("plan_id", plan.id)
    .gte("kickoff_time", from)
    .lte("kickoff_time", to);

  const have = new Set<Category>();
  for (const row of existing ?? []) {
    const type = row.prediction_type.toLowerCase();
    if (type === "home win") have.add("home_win");
    else if (type === "away win") have.add("away_win");
    else if (type.includes("btts") || type.includes("both teams")) have.add("btts");
    else if (type.includes("double chance")) have.add("double_chance");
    else if (type.includes("over 1.5")) have.add("over_1_5");
    else if (type.includes("over 2.5")) have.add("over_2_5");
  }

  const needed = CATEGORIES.filter((c) => !have.has(c));
  if (needed.length === 0) return { inserted: 0, reason: "already covered for this date" };

  const dateStr = targetDate.toISOString().slice(0, 10);
  const fixtures = await getFixturesByDateRange(dateStr, dateStr);
  const upcoming = sortFixturesByNotability(fixtures.filter((f) => f.fixture.status.short === "NS")).slice(0, 60);

  const remaining = new Set(needed);
  const rows: PredictionInsert[] = [];

  for (const fixture of upcoming) {
    if (remaining.size === 0) break;

    const odds = (await getOdds(fixture.fixture.id)) as OddsResponse[] | null;
    if (!odds?.length) continue;

    const base = {
      plan_id: plan.id,
      home_team: fixture.teams.home.name,
      away_team: fixture.teams.away.name,
      league: fixture.league.name,
      league_id: fixture.league.id,
      external_fixture_id: fixture.fixture.id,
      home_team_logo: fixture.teams.home.logo,
      away_team_logo: fixture.teams.away.logo,
      kickoff_time: fixture.fixture.date,
      admin_notes: `Auto-synced from API-Sports fixture #${fixture.fixture.id}.`,
    };

    const matchWinner = findBet(odds, "Match Winner");
    if (remaining.has("home_win")) {
      const odd = valueOdd(matchWinner, "Home");
      if (odd && odd >= 1.3 && odd <= 3.2) {
        rows.push({ ...base, prediction_type: "Home Win", odds: odd, confidence: confidenceFromOdds(odd) });
        remaining.delete("home_win");
        continue;
      }
    }
    if (remaining.has("away_win")) {
      const odd = valueOdd(matchWinner, "Away");
      if (odd && odd >= 1.3 && odd <= 4.0) {
        rows.push({ ...base, prediction_type: "Away Win", odds: odd, confidence: confidenceFromOdds(odd) });
        remaining.delete("away_win");
        continue;
      }
    }

    const btts = findBet(odds, "Both Teams Score");
    if (remaining.has("btts")) {
      const odd = valueOdd(btts, "Yes");
      if (odd && odd >= 1.3 && odd <= 2.6) {
        rows.push({ ...base, prediction_type: "BTTS", odds: odd, confidence: confidenceFromOdds(odd) });
        remaining.delete("btts");
        continue;
      }
    }

    const doubleChance = findBet(odds, "Double Chance");
    if (remaining.has("double_chance")) {
      const homeDraw = valueOdd(doubleChance, "Home/Draw");
      const drawAway = valueOdd(doubleChance, "Draw/Away");
      const [label, odd] =
        homeDraw && (!drawAway || homeDraw <= drawAway) ? ["Double Chance 1X", homeDraw] : ["Double Chance X2", drawAway];
      if (odd && odd >= 1.1 && odd <= 1.8) {
        rows.push({ ...base, prediction_type: label, odds: odd, confidence: confidenceFromOdds(odd) });
        remaining.delete("double_chance");
        continue;
      }
    }

    const goals = findBet(odds, "Goals Over/Under");
    if (remaining.has("over_1_5")) {
      const odd = valueOdd(goals, "Over 1.5");
      if (odd && odd >= 1.08 && odd <= 1.8) {
        rows.push({ ...base, prediction_type: "Over 1.5 Goals", odds: odd, confidence: confidenceFromOdds(odd) });
        remaining.delete("over_1_5");
        continue;
      }
    }
    if (remaining.has("over_2_5")) {
      const odd = valueOdd(goals, "Over 2.5");
      if (odd && odd >= 1.3 && odd <= 2.6) {
        rows.push({ ...base, prediction_type: "Over 2.5 Goals", odds: odd, confidence: confidenceFromOdds(odd) });
        remaining.delete("over_2_5");
      }
    }
  }

  if (rows.length === 0) return { inserted: 0, reason: "no fixtures matched odds criteria" };

  const { error } = await supabase.from("predictions").insert(rows);
  if (error) return { inserted: 0, reason: error.message };

  return { inserted: rows.length, categories: rows.map((r) => r.prediction_type) };
}
