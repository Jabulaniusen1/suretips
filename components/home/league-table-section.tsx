import { getStandings, currentFootballSeason } from "@/lib/football-api";
import { LeagueStandingsTabs } from "@/components/home/league-standings-tabs";

const LEAGUES = [
  { id: 39, name: "Premier League" },
  { id: 140, name: "La Liga" },
  { id: 135, name: "Serie A" },
  { id: 78, name: "Bundesliga" },
  { id: 61, name: "Ligue 1" },
];

export async function LeagueTableSection() {
  const season = currentFootballSeason();
  const leagues = await Promise.all(
    LEAGUES.map(async (league) => ({
      ...league,
      standings: await getStandings(league.id, season),
    }))
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold">Know the Table</h2>
      <p className="mt-1 text-sm text-muted-foreground">Live standings from Europe&apos;s top five leagues, updated as results come in.</p>
      <div className="mt-6">
        <LeagueStandingsTabs leagues={leagues} />
      </div>
    </section>
  );
}
