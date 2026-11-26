import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getPredictionById } from "@/lib/data/predictions";
import { formatKickoffFull } from "@/lib/utils/date";
import { pageMetadata } from "@/lib/seo";
import { marketOf } from "@/lib/predictions/markets";
import { getMarketPagesWithText, getSiteText } from "@/lib/content/site-text";
import { plainTextOf } from "@/lib/content/plain-text";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PlainContent } from "@/components/content/plain-content";
import { ResultBadge } from "@/components/predictions/prediction-list";
import { ResponsibleNotice } from "@/components/site/responsible-notice";

type Props = { params: Promise<{ id: string }> };

export const revalidate = 300;

/** Render each URL on first visit, then serve it from the ISR cache. */
export async function generateStaticParams() {
  return [];
}

// Predictions linked to an API fixture live on the match page, which is the
// single canonical URL for that fixture -- this route only redirects there.
// Manual picks without a fixture get a minimal, noindex page.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const prediction = await getPredictionById(id);
  if (!prediction) notFound();
  if (prediction.external_fixture_id) permanentRedirect(`/match/${prediction.external_fixture_id}`);

  return pageMetadata({
    title: `${prediction.home_team} vs ${prediction.away_team} Prediction`,
    description: `${prediction.prediction_type} prediction for ${prediction.home_team} vs ${prediction.away_team}${prediction.league ? ` (${prediction.league})` : ""}.`,
    path: `/predictions/${id}`,
    noIndex: true,
  });
}

export default async function PredictionDetailPage({ params }: Props) {
  const { id } = await params;
  const prediction = await getPredictionById(id);
  if (!prediction) notFound();
  if (prediction.external_fixture_id) permanentRedirect(`/match/${prediction.external_fixture_id}`);

  const [text, markets] = await Promise.all([getSiteText(), getMarketPagesWithText()]);
  const market = marketOf(prediction);
  const marketPage = market ? markets.forMarket(market) : undefined;
  const fixture = `${prediction.home_team} vs ${prediction.away_team}`;
  const hasScore = prediction.home_score !== null && prediction.away_score !== null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: text.t("prediction.breadcrumb"), path: "/predictions" }, { name: fixture, path: `/predictions/${id}` }]} />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{text.t("prediction.h1", { fixture })}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {prediction.league ? `${prediction.league} · ` : ""}
        <time dateTime={prediction.kickoff_time}>{formatKickoffFull(prediction.kickoff_time)}</time>
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">{text.t("prediction.pick")}</dt>
          <dd className="font-semibold">{prediction.original_prediction_type}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{text.t("prediction.odds")}</dt>
          <dd className="font-semibold">{prediction.original_odds !== null ? Number(prediction.original_odds).toFixed(2) : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{text.t("prediction.confidence")}</dt>
          <dd className="font-semibold">{prediction.confidence !== null ? `${prediction.confidence}%` : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{text.t("prediction.result")}</dt>
          <dd>
            {hasScore && <span className="mr-2 font-semibold">{prediction.home_score}–{prediction.away_score}</span>}
            <ResultBadge result={prediction.result} verified={prediction.result_approved} />
          </dd>
        </div>
      </dl>

      {prediction.analysis && (
        <section className="mt-6">
          <h2 className="font-bold">{text.t("prediction.why")}</h2>
          <PlainContent text={prediction.analysis} className="mt-2 text-muted-foreground" />
        </section>
      )}

      {marketPage && (
        <p className="mt-6 text-sm">
          {text.t("prediction.moreInMarket")}{" "}
          <Link href={`/tips/${marketPage.slug}`} className="font-medium text-brand hover:underline">
            {plainTextOf(marketPage.h1)}
          </Link>
        </p>
      )}

      <ResponsibleNotice className="mt-8" />
    </div>
  );
}
