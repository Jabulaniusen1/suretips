import "server-only";

// API-Sports (API-Football v3) client.
//
// Every request either resolves with the API's `response` array or throws a
// FootballApiError. Callers must never treat a failed request as "no data":
// the sync job aborts on errors, the score updater skips the affected
// fixtures, and pages fall back to stored data or render an explicit
// "statistics unavailable" state instead of claiming there were no matches.

const BASE_URL = (process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io").replace(/\/$/, "");
const API_TIME_ZONE = "Africa/Lagos";

export type FootballApiErrorKind = "not_configured" | "rate_limited" | "http" | "api" | "network";

export class FootballApiError extends Error {
  constructor(
    message: string,
    readonly kind: FootballApiErrorKind
  ) {
    super(message);
    this.name = "FootballApiError";
  }
}

export function isFootballApiConfigured(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY);
}

type Params = Record<string, string | number | undefined>;

async function apiRequest<T>(path: string, params: Params, revalidate: number): Promise<T[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new FootballApiError("API_FOOTBALL_KEY is not set", "not_configured");

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const url = `${BASE_URL}${path}?${query.toString()}`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { "x-apisports-key": apiKey }, next: { revalidate } });
  } catch (err) {
    throw new FootballApiError(`${path} request failed: ${err instanceof Error ? err.message : String(err)}`, "network");
  }

  if (res.status === 429) {
    throw new FootballApiError(`${path} rate limited (HTTP 429)`, "rate_limited");
  }
  if (!res.ok) {
    throw new FootballApiError(`${path} failed with HTTP ${res.status}`, "http");
  }

  let json: { errors?: unknown; response?: unknown };
  try {
    json = await res.json();
  } catch {
    throw new FootballApiError(`${path} returned invalid JSON`, "api");
  }

  // API-Sports reports quota/parameter problems as HTTP 200 with a non-empty
  // `errors` object (or array).
  const errors = json.errors;
  const hasErrors = Array.isArray(errors) ? errors.length > 0 : errors && typeof errors === "object" && Object.keys(errors).length > 0;
  if (hasErrors) {
    const message = JSON.stringify(errors);
    const rateLimited = /request|rate ?limit|too many/i.test(message);
    throw new FootballApiError(`${path} API error: ${message}`, rateLimited ? "rate_limited" : "api");
  }

  if (!Array.isArray(json.response)) {
    throw new FootballApiError(`${path} returned an unexpected payload`, "api");
  }
  return json.response as T[];
}

/**
 * Runs an API call for page rendering. On failure it logs and returns the
 * fallback together with `failed: true`, so the page can say the data is
 * unavailable rather than implying it doesn't exist.
 */
export async function attempt<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<{ data: T; failed: boolean }> {
  try {
    return { data: await fn(), failed: false };
  } catch (err) {
    if (!(err instanceof FootballApiError && err.kind === "not_configured")) {
      console.error(`[football-api] ${label}:`, err instanceof Error ? err.message : err);
    }
    return { data: fallback, failed: true };
  }
}

// ---------------------------------------------------------------------------
// Types (subset of the API-Sports payloads we use)
// ---------------------------------------------------------------------------

export interface TeamRef {
  id: number;
  name: string;
  logo: string;
  winner?: boolean | null;
}

export interface ScorePair {
  home: number | null;
  away: number | null;
}

export interface FixtureSummary {
  fixture: {
    id: number;
    date: string;
    referee?: string | null;
    venue?: { id: number | null; name: string | null; city: string | null };
    status: { short: string; long?: string; elapsed?: number | null };
  };
  league: { id: number; name: string; logo: string; country?: string; season?: number; round?: string };
  teams: { home: TeamRef; away: TeamRef };
  goals: ScorePair;
  score?: { halftime?: ScorePair; fulltime?: ScorePair; extratime?: ScorePair; penalty?: ScorePair };
}

export interface StandingRecord {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: { for: number; against: number };
}

export interface StandingRow {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group?: string;
  form?: string | null;
  description?: string | null;
  all: StandingRecord;
  home?: StandingRecord;
  away?: StandingRecord;
}

export interface OddsValue {
  value: string;
  odd: string;
}

export interface OddsBet {
  id?: number;
  name: string;
  values: OddsValue[];
}

export interface OddsResponse {
  bookmakers: Array<{ id: number; name: string; bets: OddsBet[] }>;
}

// ---------------------------------------------------------------------------
// Fixture status helpers
// ---------------------------------------------------------------------------

export const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);
export const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);
/** Matches that will not be completed as scheduled -- bets are void. */
export const VOID_STATUSES = new Set(["CANC", "ABD", "AWD", "WO"]);
export const NOT_STARTED_STATUSES = new Set(["NS", "TBD", "PST"]);

/** Regular-time score, which is what these betting markets settle on. */
/** `goals` includes extra time; `score.fulltime` is the 90-minute score. */
export function regularTimeScore(fixture: FixtureSummary): ScorePair {
  const fulltime = fixture.score?.fulltime;
  if (fulltime && fulltime.home !== null && fulltime.away !== null) return fulltime;
  return fixture.goals;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/** All fixtures on a Lagos calendar day (yyyy-MM-dd). */
export async function getFixturesByDate(dateKey: string): Promise<FixtureSummary[]> {
  return apiRequest<FixtureSummary>("/fixtures", { date: dateKey, timezone: API_TIME_ZONE }, 900);
}

/** Fixtures for one league between two dates (inclusive, yyyy-MM-dd). */
export async function getLeagueFixtures(leagueId: number, season: number, from: string, to: string): Promise<FixtureSummary[]> {
  return apiRequest<FixtureSummary>(
    "/fixtures",
    { league: leagueId, season, from, to, timezone: API_TIME_ZONE },
    1800
  );
}

/** Returns null when the fixture genuinely does not exist. */
export async function getFixtureById(fixtureId: number, revalidate = 60): Promise<FixtureSummary | null> {
  const response = await apiRequest<FixtureSummary>("/fixtures", { id: fixtureId, timezone: API_TIME_ZONE }, revalidate);
  return response[0] ?? null;
}

/** Fetches many fixtures using the `ids` parameter (max 20 per request). */
export async function getFixturesByIds(fixtureIds: number[], revalidate = 0): Promise<FixtureSummary[]> {
  const unique = [...new Set(fixtureIds)];
  const results: FixtureSummary[] = [];
  for (let i = 0; i < unique.length; i += 20) {
    const batch = unique.slice(i, i + 20);
    results.push(...(await apiRequest<FixtureSummary>("/fixtures", { ids: batch.join("-"), timezone: API_TIME_ZONE }, revalidate)));
  }
  return results;
}

export async function getH2H(team1: number, team2: number, last = 10): Promise<FixtureSummary[]> {
  return apiRequest<FixtureSummary>("/fixtures/headtohead", { h2h: `${team1}-${team2}`, last, timezone: API_TIME_ZONE }, 21600);
}

/** A team's most recent completed fixtures, newest first. */
export async function getTeamRecentFixtures(teamId: number, last = 5): Promise<FixtureSummary[]> {
  return apiRequest<FixtureSummary>("/fixtures", { team: teamId, last, timezone: API_TIME_ZONE }, 21600);
}

/** Every group of a league's standings (domestic leagues have one group). */
export async function getStandingGroups(leagueId: number, season: number): Promise<StandingRow[][]> {
  const response = await apiRequest<{ league: { standings: StandingRow[][] } }>("/standings", { league: leagueId, season }, 3600);
  return response[0]?.league.standings ?? [];
}

/** First (or only) standings group -- the full table for domestic leagues. */
export async function getStandings(leagueId: number, season: number): Promise<StandingRow[] | null> {
  const groups = await getStandingGroups(leagueId, season);
  return groups[0] ?? null;
}

export async function getOdds(fixtureId: number): Promise<OddsResponse[]> {
  const bookmaker = process.env.API_FOOTBALL_BOOKMAKER_ID || undefined;
  return apiRequest<OddsResponse>("/odds", { fixture: fixtureId, bookmaker }, 600);
}

// League IDs whose API-Sports "season" is the calendar year the event takes
// place in (e.g. World Cup 2026 -> season=2026) rather than the start year of
// an Aug-May domestic season.
const CALENDAR_YEAR_LEAGUE_IDS = new Set([1, 6, 4, 9]);

export function seasonForDate(date: Date, leagueId?: number | null): number {
  if (leagueId && CALENDAR_YEAR_LEAGUE_IDS.has(leagueId)) return date.getUTCFullYear();
  return date.getUTCMonth() >= 6 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
}

export function currentFootballSeason(leagueId?: number | null): number {
  return seasonForDate(new Date(), leagueId);
}
