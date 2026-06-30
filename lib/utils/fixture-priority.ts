import type { FixtureSummary } from "@/lib/football-api";

const NOTABLE_LEAGUE_RE = /world cup|champions league|europa|premier league|la liga|serie a|bundesliga|ligue 1/i;

/**
 * Sorts fixtures so recognizable competitions come first (they tend to have
 * deeper, more liquid bookmaker odds coverage -- and picks people actually
 * want to see) before falling back to kickoff time. Used wherever we scan a
 * day's fixtures looking for usable odds within a limited number of API
 * calls, so the scan doesn't burn its budget on odds-sparse youth/lower
 * league matches before reaching the leagues likely to have data.
 */
export function sortFixturesByNotability(fixtures: FixtureSummary[]): FixtureSummary[] {
  return [...fixtures].sort((a, b) => {
    const aNotable = NOTABLE_LEAGUE_RE.test(a.league.name) ? 0 : 1;
    const bNotable = NOTABLE_LEAGUE_RE.test(b.league.name) ? 0 : 1;
    if (aNotable !== bNotable) return aNotable - bNotable;
    return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
  });
}
