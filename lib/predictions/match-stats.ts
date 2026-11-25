// Pure helpers that summarise real API-Sports fixtures for match pages.
// Nothing here invents data: summaries only describe the fixtures passed in.

export interface FixtureLike {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
}

const COMPLETED = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

export function isCompleted(f: FixtureLike): boolean {
  return COMPLETED.has(f.fixture.status.short) && f.goals.home !== null && f.goals.away !== null;
}

export type FormResult = "W" | "D" | "L";

export interface FormEntry {
  fixtureId: number;
  date: string;
  opponent: string;
  venue: "H" | "A";
  goalsFor: number;
  goalsAgainst: number;
  result: FormResult;
  competition: string;
}

/** A team's completed fixtures, newest first, from its own perspective. */
export function teamForm(teamId: number, fixtures: readonly FixtureLike[], limit = 5): FormEntry[] {
  return fixtures
    .filter(isCompleted)
    .filter((f) => f.teams.home.id === teamId || f.teams.away.id === teamId)
    .sort((a, b) => b.fixture.date.localeCompare(a.fixture.date))
    .slice(0, limit)
    .map((f) => {
      const home = f.teams.home.id === teamId;
      const goalsFor = (home ? f.goals.home : f.goals.away) as number;
      const goalsAgainst = (home ? f.goals.away : f.goals.home) as number;
      return {
        fixtureId: f.fixture.id,
        date: f.fixture.date,
        opponent: home ? f.teams.away.name : f.teams.home.name,
        venue: home ? "H" : "A",
        goalsFor,
        goalsAgainst,
        result: goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D",
        competition: f.league.name,
      };
    });
}

export interface FormSummary {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  bothScored: number;
  over25: number;
  cleanSheets: number;
}

export function summarizeForm(entries: readonly FormEntry[]): FormSummary {
  return entries.reduce<FormSummary>(
    (acc, e) => ({
      played: acc.played + 1,
      wins: acc.wins + (e.result === "W" ? 1 : 0),
      draws: acc.draws + (e.result === "D" ? 1 : 0),
      losses: acc.losses + (e.result === "L" ? 1 : 0),
      goalsFor: acc.goalsFor + e.goalsFor,
      goalsAgainst: acc.goalsAgainst + e.goalsAgainst,
      bothScored: acc.bothScored + (e.goalsFor > 0 && e.goalsAgainst > 0 ? 1 : 0),
      over25: acc.over25 + (e.goalsFor + e.goalsAgainst > 2 ? 1 : 0),
      cleanSheets: acc.cleanSheets + (e.goalsAgainst === 0 ? 1 : 0),
    }),
    { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, bothScored: 0, over25: 0, cleanSheets: 0 }
  );
}

export interface H2HSummary {
  played: number;
  /** Wins for the team listed first (the home side of the upcoming match). */
  teamAWins: number;
  teamBWins: number;
  draws: number;
  totalGoals: number;
  bothScored: number;
  over25: number;
}

/** Head-to-head record from the perspective of teamA vs teamB. */
export function summarizeH2H(teamAId: number, fixtures: readonly FixtureLike[]): H2HSummary {
  return fixtures.filter(isCompleted).reduce<H2HSummary>(
    (acc, f) => {
      const home = f.goals.home as number;
      const away = f.goals.away as number;
      const aGoals = f.teams.home.id === teamAId ? home : away;
      const bGoals = f.teams.home.id === teamAId ? away : home;
      return {
        played: acc.played + 1,
        teamAWins: acc.teamAWins + (aGoals > bGoals ? 1 : 0),
        teamBWins: acc.teamBWins + (bGoals > aGoals ? 1 : 0),
        draws: acc.draws + (aGoals === bGoals ? 1 : 0),
        totalGoals: acc.totalGoals + home + away,
        bothScored: acc.bothScored + (home > 0 && away > 0 ? 1 : 0),
        over25: acc.over25 + (home + away > 2 ? 1 : 0),
      };
    },
    { played: 0, teamAWins: 0, teamBWins: 0, draws: 0, totalGoals: 0, bothScored: 0, over25: 0 }
  );
}

export function average(total: number, count: number): string {
  return count > 0 ? (total / count).toFixed(1) : "0.0";
}
