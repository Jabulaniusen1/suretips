import type { Metadata } from "next";
import { getActiveCompetitions } from "@/lib/data/competitions";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { CompetitionsStrip } from "@/components/home/competitions-strip";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Football Predictions by League & Competition",
  description:
    "Free predictions, fixtures, tables and verified results for the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, the Champions League and more.",
  path: "/competitions",
});

export default async function CompetitionsPage() {
  const competitions = await getActiveCompetitions();
  const leagues = competitions.filter((c) => c.competition_type !== "cup");
  const cups = competitions.filter((c) => c.competition_type === "cup");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: "Competitions", path: "/competitions" }]} />
      <JsonLd data={itemListJsonLd("Football competitions", competitions.map((c) => ({ name: `${c.name} predictions`, path: `/competitions/${c.slug}` })))} />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Football Predictions by Competition</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Each competition hub brings together our free predictions for that league or tournament with upcoming fixtures, the
        current table, recent results and the verified record of every tip we have published there.
      </p>

      {leagues.length > 0 && (
        <section aria-labelledby="leagues" className="mt-8">
          <h2 id="leagues" className="text-lg font-bold">
            Domestic leagues
          </h2>
          <div className="mt-4">
            <CompetitionsStrip competitions={leagues} />
          </div>
        </section>
      )}
      {cups.length > 0 && (
        <section aria-labelledby="cups" className="mt-8">
          <h2 id="cups" className="text-lg font-bold">
            European and international competitions
          </h2>
          <div className="mt-4">
            <CompetitionsStrip competitions={cups} />
          </div>
        </section>
      )}
      {competitions.length === 0 && <p className="mt-8 text-muted-foreground">Competition hubs are being set up — check back soon.</p>}
    </div>
  );
}
