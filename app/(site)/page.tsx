import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, ListChecks, Scale } from "lucide-react";
import { getPredictionsForDay } from "@/lib/data/predictions";
import { getActiveCompetitions } from "@/lib/data/competitions";
import { getResultWindows } from "@/lib/data/results";
import { getSiteConfig, socialProfileUrls } from "@/lib/data/site-config";
import { addDaysToKey, formatDateKeyLong, getDateRange, isOtherDayView, lagosDateKey } from "@/lib/utils/date";
import { formatWinRate } from "@/lib/predictions/stats";
import { organizationJsonLd, pageMetadata, websiteJsonLd } from "@/lib/seo";
import { MarketNav } from "@/components/predictions/market-nav";
import { DateNav } from "@/components/predictions/date-nav";
import { PredictionList } from "@/components/predictions/prediction-list";
import { ResultsSummary } from "@/components/predictions/results-summary";
import { MarketGrid } from "@/components/home/market-grid";
import { CompetitionsStrip } from "@/components/home/competitions-strip";
import { BlogSection } from "@/components/home/blog-section";
import { LeagueTableSection } from "@/components/home/league-table-section";
import { ResponsibleNotice } from "@/components/site/responsible-notice";
import { JsonLd } from "@/components/seo/json-ld";

type HomeSearchParams = Promise<{ period?: string; date?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: HomeSearchParams }): Promise<Metadata> {
  const { period, date } = await searchParams;
  return pageMetadata({
    title: "Free Football Predictions Today",
    absoluteTitle: "Free Football Predictions Today & Soccer Tips | SureMatchContact",
    description:
      "Free football predictions today: daily soccer tips by market with odds, confidence and match analysis, plus a verified public record of every result.",
    path: "/",
    noIndex: isOtherDayView(period, date),
  });
}

const HOME_MARKETS = ["free", "safe-picks", "over-2-5", "over-1-5", "btts", "under-2-5", "home-win", "double-chance"];

const TRUST_POINTS = [
  {
    icon: ListChecks,
    title: "Every pick stays on the record",
    text: "Predictions are published before kickoff and the selection is frozen once the match starts. Losses are never deleted.",
  },
  {
    icon: CheckCircle2,
    title: "Results are verified",
    text: "Scores come from API-Sports and are graded automatically, then checked by an editor before they count in our statistics.",
  },
  {
    icon: Scale,
    title: "Confidence is explained",
    text: "For automatic picks, confidence is the bookmaker's implied probability — a ranking aid, not a promise.",
  },
];

export default async function HomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  const { period, date } = await searchParams;
  const range = getDateRange(period, date);
  const todayKey = lagosDateKey();
  const tomorrowKey = addDaysToKey(todayKey, 1);
  const isToday = range.dateKey === todayKey;

  const [predictions, todays, tomorrow, competitions, results, config] = await Promise.all([
    getPredictionsForDay(range.dateKey),
    getPredictionsForDay(todayKey),
    getPredictionsForDay(tomorrowKey),
    getActiveCompetitions(),
    getResultWindows(),
    getSiteConfig(),
  ]);

  const leagues = new Set(predictions.map((p) => p.league_id ?? p.league)).size;
  const heading = isToday ? "Today's free predictions" : `Predictions for ${range.label}`;

  return (
    <>
      <JsonLd data={[organizationJsonLd(socialProfileUrls(config)), websiteJsonLd()]} />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="max-w-3xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Free Football Predictions Today – Daily Soccer Tips &amp; Match Analysis
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            SureMatchContact publishes free football predictions every day across the match result, goals, both teams to score and
            double chance markets. Each tip shows its odds and confidence, links to a match preview with head-to-head and form data,
            and stays on our public results record — win or lose.
          </p>
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Today:</dt>
              <dd className="font-semibold">
                {todays.length} {todays.length === 1 ? "prediction" : "predictions"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Verified win rate, last 30 days:</dt>
              <dd className="font-semibold">
                <Link href="/previous-results" className="hover:text-brand">
                  {results.last30 && results.last30.settled > 0
                    ? `${formatWinRate(results.last30.winRate)} (${results.last30.settled} settled)`
                    : "not enough verified results yet"}
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="todays-predictions" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <MarketNav active="all" />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="todays-predictions" className="text-xl font-bold">
              {heading}
            </h2>
            <p className="text-sm text-muted-foreground">
              {range.label} · {predictions.length} {predictions.length === 1 ? "tip" : "tips"} in {leagues}{" "}
              {leagues === 1 ? "competition" : "competitions"}
            </p>
          </div>
          <DateNav active={range.period} basePath="/" dateKey={range.dateKey} dateLabel={range.label} />
        </div>
        <div className="mt-4">
          <PredictionList
            predictions={predictions}
            emptyState={
              <>
                No predictions have been published for {range.label} yet. New picks are usually added the day before kickoff —
                see <Link href="/predictions" className="font-medium text-brand hover:underline">upcoming predictions</Link> or the{" "}
                <Link href="/previous-results" className="font-medium text-brand hover:underline">previous results</Link>.
              </>
            }
          />
        </div>
      </section>

      {isToday && tomorrow.length > 0 && (
        <section aria-labelledby="tomorrow" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="tomorrow" className="text-xl font-bold">
                Tomorrow&apos;s football predictions
              </h2>
              <p className="text-sm text-muted-foreground">{formatDateKeyLong(tomorrowKey)}</p>
            </div>
            <Link href="/predictions" className="text-sm font-medium text-brand hover:underline">
              All {tomorrow.length} upcoming tips →
            </Link>
          </div>
          <div className="mt-4">
            <PredictionList predictions={tomorrow.slice(0, 10)} />
          </div>
        </section>
      )}

      <section aria-labelledby="markets" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="markets" className="text-xl font-bold">
            Popular betting markets
          </h2>
          <Link href="/tips" className="text-sm font-medium text-brand hover:underline">
            All markets →
          </Link>
        </div>
        <div className="mt-4">
          <MarketGrid predictions={todays} slugs={HOME_MARKETS} />
        </div>
      </section>

      {competitions.length > 0 && (
        <section aria-labelledby="competitions" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="competitions" className="text-xl font-bold">
              Predictions by competition
            </h2>
            <Link href="/competitions" className="text-sm font-medium text-brand hover:underline">
              All competitions →
            </Link>
          </div>
          <div className="mt-4">
            <CompetitionsStrip competitions={competitions.slice(0, 10)} />
          </div>
        </section>
      )}

      <section aria-labelledby="results" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="results" className="text-xl font-bold">
              Previous results
            </h2>
            <p className="text-sm text-muted-foreground">Verified results from the last 7 days. Losses included.</p>
          </div>
          <Link href="/previous-results" className="text-sm font-medium text-brand hover:underline">
            Full results history →
          </Link>
        </div>
        <div className="mt-4">
          <ResultsSummary summary={results.last7} />
        </div>
      </section>

      <BlogSection />
      <LeagueTableSection />

      <section aria-labelledby="trust" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 id="trust" className="text-xl font-bold">
          How SureMatchContact works
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {TRUST_POINTS.map((point) => (
            <div key={point.title} className="rounded-2xl border border-border bg-card p-5">
              <point.icon aria-hidden className="size-5 text-brand" />
              <h3 className="mt-3 font-semibold">{point.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{point.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm">
          <Link href="/methodology" className="font-medium text-brand hover:underline">
            Read the full methodology
          </Link>{" "}
          ·{" "}
          <Link href="/about" className="font-medium text-brand hover:underline">
            About us
          </Link>
        </p>
        <ResponsibleNotice className="mt-6" />
      </section>
    </>
  );
}
