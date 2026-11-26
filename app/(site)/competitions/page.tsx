import type { Metadata } from "next";
import { InlineContent, PlainContent } from "@/components/content/plain-content";
import { getSiteText } from "@/lib/content/site-text";
import { getActiveCompetitions } from "@/lib/data/competitions";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { CompetitionsStrip } from "@/components/home/competitions-strip";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const text = await getSiteText();
  return pageMetadata({ title: text.t("comps.seoTitle"), description: text.t("comps.seoDescription"), path: "/competitions" });
}

export default async function CompetitionsPage() {
  const [competitions, text] = await Promise.all([getActiveCompetitions(), getSiteText()]);
  const intro = text.t("comps.intro");
  const leagues = competitions.filter((c) => c.competition_type !== "cup");
  const cups = competitions.filter((c) => c.competition_type === "cup");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: text.t("comps.breadcrumb"), path: "/competitions" }]} />
      <JsonLd data={itemListJsonLd("Football competitions", competitions.map((c) => ({ name: `${c.name} predictions`, path: `/competitions/${c.slug}` })))} />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
        <InlineContent text={text.t("comps.h1")} />
      </h1>
      {intro && <PlainContent text={intro} className="mt-3 max-w-3xl text-muted-foreground" />}

      {leagues.length > 0 && (
        <section aria-labelledby="leagues" className="mt-8">
          <h2 id="leagues" className="text-lg font-bold">
            <InlineContent text={text.t("comps.leagues")} />
          </h2>
          <div className="mt-4">
            <CompetitionsStrip competitions={leagues} />
          </div>
        </section>
      )}
      {cups.length > 0 && (
        <section aria-labelledby="cups" className="mt-8">
          <h2 id="cups" className="text-lg font-bold">
            <InlineContent text={text.t("comps.cups")} />
          </h2>
          <div className="mt-4">
            <CompetitionsStrip competitions={cups} />
          </div>
        </section>
      )}
      {competitions.length === 0 && (
        <p className="mt-8 text-muted-foreground">
          <InlineContent text={text.t("comps.empty")} />
        </p>
      )}
    </div>
  );
}
