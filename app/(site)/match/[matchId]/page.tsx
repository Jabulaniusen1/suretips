import { notFound } from "next/navigation";
import { format } from "date-fns";
import type { Metadata } from "next";
import { getFixtureById, getH2H } from "@/lib/football-api";

export async function generateMetadata({ params }: { params: Promise<{ matchId: string }> }): Promise<Metadata> {
  const { matchId } = await params;
  const fixture = await getFixtureById(Number(matchId));
  if (!fixture) return {};
  return { title: `${fixture.teams.home.name} vs ${fixture.teams.away.name}` };
}

export default async function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const fixture = await getFixtureById(Number(matchId));
  if (!fixture) notFound();

  const h2h = await getH2H(fixture.teams.home.id, fixture.teams.away.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm text-muted-foreground">{fixture.league.name}</p>
      <h1 className="mt-1 text-2xl font-bold">
        {fixture.teams.home.name} vs {fixture.teams.away.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{format(new Date(fixture.fixture.date), "EEEE, d MMM yyyy 'at' HH:mm")}</p>

      <section className="mt-8">
        <h2 className="font-bold">Head to Head</h2>
        <div className="mt-3 space-y-2">
          {h2h.slice(0, 5).map((match) => (
            <div key={match.fixture.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
              <span>
                {match.teams.home.name} {match.goals.home ?? "-"} : {match.goals.away ?? "-"} {match.teams.away.name}
              </span>
              <span className="text-muted-foreground">{format(new Date(match.fixture.date), "d MMM yyyy")}</span>
            </div>
          ))}
          {h2h.length === 0 && <p className="text-sm text-muted-foreground">No previous meetings on record.</p>}
        </div>
      </section>
    </div>
  );
}
