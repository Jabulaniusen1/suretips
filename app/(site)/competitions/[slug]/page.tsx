import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { addDays, format } from "date-fns";
import { getCompetitionBySlug } from "@/lib/data/competitions";
import { getStandings, getFixturesByDateRange, currentFootballSeason } from "@/lib/football-api";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCompetitionBySlug(slug);
  if (!competition) return {};
  return { title: competition.seo_title ?? competition.name, description: competition.seo_description ?? undefined };
}

export default async function CompetitionHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competition = await getCompetitionBySlug(slug);
  if (!competition) notFound();

  const today = new Date();
  const [standings, fixtures, relatedPosts] = await Promise.all([
    competition.league_id ? getStandings(competition.league_id, competition.current_season ?? currentFootballSeason()) : null,
    competition.league_id
      ? getFixturesByDateRange(format(today, "yyyy-MM-dd"), format(addDays(today, 7), "yyyy-MM-dd"), competition.league_id)
      : Promise.resolve([]),
    (async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("competition_id", competition.id)
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(3);
      return data ?? [];
    })(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">{competition.heading ?? competition.name}</h1>
      {competition.subheading && <p className="mt-2 text-muted-foreground">{competition.subheading}</p>}
      {competition.introduction && <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{competition.introduction}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-bold">Upcoming Fixtures</h2>
          <div className="mt-3 space-y-2">
            {fixtures.slice(0, 8).map((fixture) => (
              <Link
                key={fixture.fixture.id}
                href={`/match/${fixture.fixture.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm hover:border-brand"
              >
                <span>
                  {fixture.teams.home.name} vs {fixture.teams.away.name}
                </span>
                <span className="text-muted-foreground">{format(new Date(fixture.fixture.date), "d MMM, HH:mm")}</span>
              </Link>
            ))}
            {fixtures.length === 0 && <p className="text-sm text-muted-foreground">No fixtures available right now.</p>}
          </div>
        </section>

        <section>
          <h2 className="font-bold">Standings</h2>
          {standings ? (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {standings.slice(0, 10).map((row) => (
                    <tr key={row.team.id}>
                      <td className="py-2 pl-3 font-medium">{row.rank}</td>
                      <td className="py-2">{row.team.name}</td>
                      <td className="py-2 pr-3 text-right font-bold">{row.points} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Standings unavailable right now.</p>
          )}
        </section>
      </div>

      {relatedPosts.length > 0 && (
        <section className="mt-10">
          <h2 className="font-bold">Related Articles</h2>
          <div className="mt-3 space-y-2">
            {relatedPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block rounded-xl border border-border bg-card p-3 text-sm hover:border-brand">
                {post.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
