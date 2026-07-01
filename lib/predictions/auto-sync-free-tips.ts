import { startOfDay, endOfDay } from "date-fns";
import { createServiceClient } from "@/lib/supabase/service";
import { getFixturesByDateRange, getOdds } from "@/lib/football-api";
import { sortFixturesByNotability } from "@/lib/utils/fixture-priority";
import type { Database } from "@/types/database";

type PredictionInsert = Database["public"]["Tables"]["predictions"]["Insert"];

interface OddsValue { value: string; odd: string }
interface OddsBet { name: string; values: OddsValue[] }
interface OddsResponse { bookmakers: Array<{ bets: OddsBet[] }> }

type Category = "home_win" | "away_win" | "btts" | "double_chance" | "over_1_5" | "over_2_5";

const CATEGORIES: Category[] = ["home_win", "away_win", "btts", "double_chance", "over_1_5", "over_2_5"];

// Target number of picks per filter category shown to users
const TARGET_PER_CATEGORY = 10;

// Max fixtures to scan per run — each costs one getOdds() API call
const MAX_FIXTURE_SCAN = 80;

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

function categoryKey(predictionType: string): Category | null {
  const t = predictionType.toLowerCase();
  if (t === "home win") return "home_win";
  if (t === "away win") return "away_win";
  if (t.includes("btts") || t.includes("both teams")) return "btts";
  if (t.includes("double chance")) return "double_chance";
  if (t.includes("over 1.5")) return "over_1_5";
  if (t.includes("over 2.5")) return "over_2_5";
  return null;
}

export async function autoSyncFreeTips(targetDate: Date = new Date()) {
  const supabase = createServiceClient();

  const { data: plan } = await supabase.from("plans").select("id").eq("slug", "free-games").single();
  if (!plan) return { inserted: 0, reason: "free-games plan not found" };

  const from = startOfDay(targetDate).toISOString();
  const to = endOfDay(targetDate).toISOString();

  // Count existing picks per category and track (fixture_id, prediction_type) pairs already inserted
  const { data: existing } = await supabase
    .from("predictions")
    .select("prediction_type, external_fixture_id")
    .eq("plan_id", plan.id)
    .gte("kickoff_time", from)
    .lte("kickoff_time", to);

  const counts: Record<Category, number> = {
    home_win: 0, away_win: 0, btts: 0, double_chance: 0, over_1_5: 0, over_2_5: 0,
  };
  const existingPairs = new Set<string>();

  for (const row of existing ?? []) {
    const cat = categoryKey(row.prediction_type ?? "");
    if (cat) counts[cat]++;
    if (row.external_fixture_id) {
      existingPairs.add(`${row.external_fixture_id}:${(row.prediction_type ?? "").toLowerCase()}`);
    }
  }

  const needed = CATEGORIES.filter((c) => counts[c] < TARGET_PER_CATEGORY);
  if (needed.length === 0) return { inserted: 0, reason: "already covered for this date" };

  const dateStr = targetDate.toISOString().slice(0, 10);
  const fixtures = await getFixturesByDateRange(dateStr, dateStr);
  const upcoming = sortFixturesByNotability(
    fixtures.filter((f) => f.fixture.status.short === "NS")
  ).slice(0, MAX_FIXTURE_SCAN);

  const rows: PredictionInsert[] = [];

  for (const fixture of upcoming) {
    // Stop early if every category has reached the target
    if (CATEGORIES.every((c) => (counts[c] + rows.filter((r) => categoryKey(r.prediction_type ?? "") === c).length) >= TARGET_PER_CATEGORY)) break;

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

    const rowsForFixture: PredictionInsert[] = [];

    const alreadyFilled = (cat: Category, predType: string) => {
      const key = `${fixture.fixture.id}:${predType.toLowerCase()}`;
      if (existingPairs.has(key)) return true;
      const added = rows.filter((r) => categoryKey(r.prediction_type ?? "") === cat).length;
      return counts[cat] + added >= TARGET_PER_CATEGORY;
    };

    const tryAdd = (cat: Category, predType: string, odd: number | null, minOdd: number, maxOdd: number) => {
      if (!odd || odd < minOdd || odd > maxOdd) return;
      if (alreadyFilled(cat, predType)) return;
      rowsForFixture.push({ ...base, prediction_type: predType, odds: odd, confidence: confidenceFromOdds(odd) });
    };

    const matchWinner = findBet(odds, "Match Winner");
    tryAdd("home_win", "Home Win", valueOdd(matchWinner, "Home"), 1.3, 3.2);
    tryAdd("away_win", "Away Win", valueOdd(matchWinner, "Away"), 1.3, 4.0);

    const btts = findBet(odds, "Both Teams Score");
    tryAdd("btts", "BTTS", valueOdd(btts, "Yes"), 1.3, 2.6);

    const doubleChance = findBet(odds, "Double Chance");
    const homeDraw = valueOdd(doubleChance, "Home/Draw");
    const drawAway = valueOdd(doubleChance, "Draw/Away");
    const [dcLabel, dcOdd] =
      homeDraw && (!drawAway || homeDraw <= drawAway)
        ? (["Double Chance 1X", homeDraw] as const)
        : (["Double Chance X2", drawAway] as const);
    tryAdd("double_chance", dcLabel, dcOdd, 1.1, 1.8);

    const goals = findBet(odds, "Goals Over/Under");
    tryAdd("over_1_5", "Over 1.5 Goals", valueOdd(goals, "Over 1.5"), 1.08, 1.8);
    tryAdd("over_2_5", "Over 2.5 Goals", valueOdd(goals, "Over 2.5"), 1.3, 2.6);

    rows.push(...rowsForFixture);
  }

  if (rows.length === 0) return { inserted: 0, reason: "no fixtures matched odds criteria" };

  const { error } = await supabase.from("predictions").insert(rows);
  if (error) return { inserted: 0, reason: error.message };

  return {
    inserted: rows.length,
    categories: Object.fromEntries(
      CATEGORIES.map((c) => [c, rows.filter((r) => categoryKey(r.prediction_type ?? "") === c).length])
    ),
  };
}
