"use server";

import { requireAdmin } from "@/lib/data/admin";
import { getFixturesByDateRange, getOdds } from "@/lib/football-api";

export interface FixtureOption {
  fixtureId: number;
  league: string;
  leagueId: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  kickoffTime: string;
}

export async function searchFixturesForDate(date: string): Promise<FixtureOption[]> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const fixtures = await getFixturesByDateRange(date, date);

  return fixtures
    .map((f) => ({
      fixtureId: f.fixture.id,
      league: f.league.name,
      leagueId: f.league.id,
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      homeLogo: f.teams.home.logo,
      awayLogo: f.teams.away.logo,
      kickoffTime: f.fixture.date,
    }))
    .sort((a, b) => a.league.localeCompare(b.league) || a.kickoffTime.localeCompare(b.kickoffTime));
}

export interface PickOption {
  label: string;
  predictionType: string;
  odds: number | null;
}

interface OddsBetValue {
  value: string;
  odd: string;
}
interface OddsBet {
  name: string;
  values: OddsBetValue[];
}
interface OddsResponse {
  bookmakers: Array<{ bets: OddsBet[] }>;
}

const GOAL_LINES = ["0.5", "1.5", "2.5", "3.5"];
const DOUBLE_CHANCE: Array<[string, string]> = [
  ["Home/Draw", "Double Chance 1X"],
  ["Draw/Away", "Double Chance X2"],
  ["Home/Away", "Double Chance 12"],
];

export async function getFixturePickOptions(fixtureId: number): Promise<PickOption[]> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const odds = (await getOdds(fixtureId)) as OddsResponse[] | null;
  const bets = odds?.[0]?.bookmakers?.[0]?.bets ?? [];
  const options: PickOption[] = [];

  const matchWinner = bets.find((b) => b.name === "Match Winner");
  const winnerLabels: Record<string, string> = { Home: "Home Win", Draw: "Draw", Away: "Away Win" };
  for (const outcome of ["Home", "Draw", "Away"]) {
    const v = matchWinner?.values.find((x) => x.value === outcome);
    if (v) options.push({ label: `${winnerLabels[outcome]} (${v.odd})`, predictionType: winnerLabels[outcome], odds: Number(v.odd) });
  }

  const doubleChance = bets.find((b) => b.name === "Double Chance");
  for (const [value, label] of DOUBLE_CHANCE) {
    const v = doubleChance?.values.find((x) => x.value === value);
    if (v) options.push({ label: `${label} (${v.odd})`, predictionType: label, odds: Number(v.odd) });
  }

  const btts = bets.find((b) => b.name === "Both Teams Score");
  const bttsYes = btts?.values.find((x) => x.value === "Yes");
  if (bttsYes) options.push({ label: `BTTS - Yes (${bttsYes.odd})`, predictionType: "BTTS", odds: Number(bttsYes.odd) });
  const bttsNo = btts?.values.find((x) => x.value === "No");
  if (bttsNo) options.push({ label: `BTTS - No (${bttsNo.odd})`, predictionType: "BTTS No", odds: Number(bttsNo.odd) });

  const goals = bets.find((b) => b.name === "Goals Over/Under");
  for (const line of GOAL_LINES) {
    const over = goals?.values.find((x) => x.value === `Over ${line}`);
    if (over) options.push({ label: `Over ${line} Goals (${over.odd})`, predictionType: `Over ${line} Goals`, odds: Number(over.odd) });
    const under = goals?.values.find((x) => x.value === `Under ${line}`);
    if (under) options.push({ label: `Under ${line} Goals (${under.odd})`, predictionType: `Under ${line} Goals`, odds: Number(under.odd) });
  }

  const exactScore = bets.find((b) => b.name === "Exact Score");
  for (const v of exactScore?.values.slice(0, 14) ?? []) {
    const scoreline = String(v.value).replace(":", "-");
    options.push({ label: `Correct Score ${scoreline} (${v.odd})`, predictionType: scoreline, odds: Number(v.odd) });
  }

  return options;
}
