import { attempt, currentFootballSeason, getStandings } from "@/lib/football-api";
import { LeagueStandingsTabs } from "@/components/home/league-standings-tabs";
import { getSiteText } from "@/lib/content/site-text";
import { InlineContent } from "@/components/content/plain-content";

const LEAGUES = [
  { id: 39, name: "Premier League", slug: "premier-league" },
  { id: 140, name: "La Liga", slug: "la-liga" },
  { id: 135, name: "Serie A", slug: "serie-a" },
  { id: 78, name: "Bundesliga", slug: "bundesliga" },
  { id: 61, name: "Ligue 1", slug: "ligue-1" },
];

export async function LeagueTableSection() {
  const leagues = await Promise.all(
    LEAGUES.map(async (league) => ({
      ...league,
      standings: (await attempt(`standings ${league.id}`, () => getStandings(league.id, currentFootballSeason(league.id)), null)).data,
    }))
  );
  if (leagues.every((l) => !l.standings?.length)) return null;
  const text = await getSiteText();
  const intro = text.t("home.tablesIntro");

  return (
    <section aria-labelledby="home-tables" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 id="home-tables" className="text-xl font-bold">
        <InlineContent text={text.t("home.tablesHeading")} />
      </h2>
      {intro && (
        <p className="mt-1 text-sm text-muted-foreground">
          <InlineContent text={intro} />
        </p>
      )}
      <div className="mt-5">
        <LeagueStandingsTabs leagues={leagues} />
      </div>
    </section>
  );
}
