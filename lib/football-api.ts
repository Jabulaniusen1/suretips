const BASE_URL = process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io";

async function apiFootballFetch<T>(path: string, params: Record<string, string | number | undefined>, revalidate = 3600): Promise<T | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.warn(`[football-api] API_FOOTBALL_KEY is not set — skipping ${path}`);
    return null;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }

  const url = `${BASE_URL}${path}?${query.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
      next: { revalidate },
    });

    if (res.status === 429) {
      console.error(
        `[football-api] ${url} -> 429 rate limited (remaining: ${res.headers.get("x-ratelimit-requests-remaining") ?? "?"}/${res.headers.get("x-ratelimit-requests-limit") ?? "?"})`
      );
      return null;
    }

    if (!res.ok) {
      console.error(`[football-api] ${url} -> HTTP ${res.status}`, await res.text());
      return null;
    }

    const json = await res.json();

    if (json.errors && Object.keys(json.errors).length > 0) {
      console.error(`[football-api] ${url} -> API error`, json.errors);
      return null;
    }

    console.log(`[football-api] ${url} -> ${json.results} result(s)`, JSON.stringify(json.response).slice(0, 500));

    return json.response as T;
  } catch (err) {
    console.error(`[football-api] ${url} -> threw`, err);
    return null;
  }
}

export interface StandingRow {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  all: { played: number; win: number; draw: number; lose: number };
}

export async function getStandings(leagueId: number, season: number) {
  const response = await apiFootballFetch<Array<{ league: { standings: StandingRow[][] } }>>("/standings", {
    league: leagueId,
    season,
  });
  return response?.[0]?.league.standings?.[0] ?? null;
}

export interface FixtureSummary {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string; logo: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

export async function getFixturesByDateRange(from: string, to: string, leagueId?: number) {
  // API-Sports rejects from/to on its own ("The From field need another
  // parameter") -- it requires `league`+`season` together with from/to, or
  // accepts a single `date` with no other params. Use whichever is valid
  // for the given inputs instead of always sending from/to.
  const params = leagueId
    ? { from, to, league: leagueId, season: seasonForDate(new Date(from), leagueId) }
    : from === to
      ? { date: from }
      : { from, to };

  const response = await apiFootballFetch<FixtureSummary[]>("/fixtures", params, 900);
  return response ?? [];
}

export async function getFixtureById(fixtureId: number) {
  // A short cache instead of zero -- scores still update within a minute,
  // but it absorbs duplicate calls for the same fixture landing close
  // together (e.g. the match page and the update-scores cron overlapping),
  // which matters because this endpoint has no per-run cap on call volume.
  const response = await apiFootballFetch<FixtureSummary[]>("/fixtures", { id: fixtureId }, 30);
  return response?.[0] ?? null;
}

export async function getH2H(team1: number, team2: number) {
  const response = await apiFootballFetch<FixtureSummary[]>("/fixtures/headtohead", {
    h2h: `${team1}-${team2}`,
  });
  return response ?? [];
}

export async function getOdds(fixtureId: number) {
  return apiFootballFetch<unknown[]>("/odds", { fixture: fixtureId });
}

// League IDs whose API-Sports "season" is the literal calendar year the
// event happens in (e.g. World Cup 2026 -> season=2026), not a rolling
// Aug-July domestic season start-year. Add others here if/when they're
// wired up to a sync flow -- only World Cup is currently used.
const CALENDAR_YEAR_LEAGUE_IDS = new Set([1]);

export function seasonForDate(date: Date, leagueId?: number) {
  if (leagueId && CALENDAR_YEAR_LEAGUE_IDS.has(leagueId)) {
    return date.getFullYear();
  }
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

export function currentFootballSeason() {
  return seasonForDate(new Date());
}
