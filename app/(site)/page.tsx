import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, ListChecks, MessageCircle, Scale, Send } from "lucide-react";
import { getPredictionsForDay } from "@/lib/data/predictions";
import { getActiveCompetitions } from "@/lib/data/competitions";
import { getResultWindows } from "@/lib/data/results";
import { getSiteConfig, socialProfileUrls } from "@/lib/data/site-config";
import { addDaysToKey, formatDateKeyLong, getDateRange, isOtherDayView, lagosDateKey } from "@/lib/utils/date";
import { organizationJsonLd, pageMetadata, websiteJsonLd } from "@/lib/seo";
import { MarketNav } from "@/components/predictions/market-nav";
import { DateNav } from "@/components/predictions/date-nav";
import { PredictionList } from "@/components/predictions/prediction-list";
import { ExpandablePredictionList } from "@/components/predictions/expandable-prediction-list";
import { ResultsSummary } from "@/components/predictions/results-summary";
import { MarketGrid } from "@/components/home/market-grid";
import { CompetitionsStrip } from "@/components/home/competitions-strip";
import { BlogSection } from "@/components/home/blog-section";
import { LeagueTableSection } from "@/components/home/league-table-section";
import { ResponsibleNotice } from "@/components/site/responsible-notice";
import { JsonLd } from "@/components/seo/json-ld";
import { InlineContent, PlainContent } from "@/components/content/plain-content";
import { getSiteText } from "@/lib/content/site-text";
import type { StaticContentKey } from "@/lib/content/registry";

type HomeSearchParams = Promise<{ period?: string; date?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: HomeSearchParams }): Promise<Metadata> {
  const { period, date } = await searchParams;
  const text = await getSiteText();
  return pageMetadata({
    title: text.t("home.seoTitle"),
    absoluteTitle: text.t("home.seoTitle"),
    description: text.t("home.seoDescription"),
    path: "/",
    noIndex: isOtherDayView(period, date),
  });
}

const HOME_MARKETS = ["free", "safe-picks", "over-2-5", "over-1-5", "btts", "under-2-5", "home-win", "double-chance"];

// Wording is edited in Admin > Site Content > Homepage.
const TRUST_POINTS: Array<{ icon: typeof ListChecks; title: StaticContentKey; text: StaticContentKey }> = [
  { icon: ListChecks, title: "home.trust1Title", text: "home.trust1Text" },
  { icon: CheckCircle2, title: "home.trust2Title", text: "home.trust2Text" },
  { icon: Scale, title: "home.trust3Title", text: "home.trust3Text" },
];

/** wa.me link from a number typed as "+234 801 234 5678". */
function whatsappHref(number: string): string | null {
  const digits = number.replace(/\D/g, "");
  return digits.length >= 7 ? `https://wa.me/${digits}` : null;
}

export default async function HomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  const { period, date } = await searchParams;
  const range = getDateRange(period, date);
  const todayKey = lagosDateKey();
  const tomorrowKey = addDaysToKey(todayKey, 1);
  const isToday = range.dateKey === todayKey;

  const [predictions, todays, tomorrow, competitions, results, config, text] = await Promise.all([
    getPredictionsForDay(range.dateKey),
    getPredictionsForDay(todayKey),
    getPredictionsForDay(tomorrowKey),
    getActiveCompetitions(),
    getResultWindows(),
    getSiteConfig(),
    getSiteText(),
  ]);

  const leagues = new Set(predictions.map((p) => p.league_id ?? p.league)).size;
  const heading = isToday ? text.t("home.todayHeading") : text.t("home.otherDayHeading", { date: range.label });
  const intro = text.t("home.intro");
  const telegramLabel = text.t("home.telegramButton");
  const whatsappLabel = text.t("home.whatsappButton");
  const whatsapp = config.whatsapp_number ? whatsappHref(config.whatsapp_number) : null;
  const showTelegram = Boolean(config.telegram_url && telegramLabel);
  const showWhatsapp = Boolean(whatsapp && whatsappLabel);
  const resultsIntro = text.t("home.resultsIntro");
  const trustLinks = text.t("home.trustLinks");

  return (
    <>
      <JsonLd data={[organizationJsonLd(socialProfileUrls(config)), websiteJsonLd()]} />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="max-w-3xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            <InlineContent text={text.t("home.h1")} />
          </h1>
          {intro && <PlainContent text={intro} className="mt-3 max-w-3xl text-muted-foreground" />}
          {(showTelegram || showWhatsapp) && (
            <div className="mt-5 flex flex-wrap gap-3">
              {showTelegram && (
                <a
                  href={config.telegram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
                >
                  <Send aria-hidden className="size-4" /> {telegramLabel}
                </a>
              )}
              {showWhatsapp && (
                <a
                  href={whatsapp!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
                >
                  <MessageCircle aria-hidden className="size-4" /> {whatsappLabel}
                </a>
              )}
            </div>
          )}
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
          {/* First 20 picks, with See more / See less; no Won/Lost column on the homepage. */}
          <ExpandablePredictionList
            predictions={predictions}
            pageSize={20}
            showResult={false}
            labels={{ seeMore: text.t("list.seeMore"), seeLess: text.t("list.seeLess"), moreCount: text.t("list.moreCount") }}
            emptyState={<InlineContent text={text.t("home.empty", { date: range.label })} />}
          />
        </div>
      </section>

      {isToday && tomorrow.length > 0 && (
        <section aria-labelledby="tomorrow" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="tomorrow" className="text-xl font-bold">
                <InlineContent text={text.t("home.tomorrowHeading")} />
              </h2>
              <p className="text-sm text-muted-foreground">{formatDateKeyLong(tomorrowKey)}</p>
            </div>
            <Link href="/predictions" className="text-sm font-medium text-brand hover:underline">
              {text.t("home.tomorrowLink", { count: tomorrow.length })}
            </Link>
          </div>
          <div className="mt-4">
            <PredictionList predictions={tomorrow.slice(0, 10)} showResult={false} />
          </div>
        </section>
      )}

      <section aria-labelledby="markets" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="markets" className="text-xl font-bold">
            <InlineContent text={text.t("home.marketsHeading")} />
          </h2>
          <Link href="/tips" className="text-sm font-medium text-brand hover:underline">
            {text.t("home.marketsLink")}
          </Link>
        </div>
        <div className="mt-4">
          <MarketGrid predictions={todays} slugs={HOME_MARKETS} />
        </div>
      </section>

      <BlogSection />

      {competitions.length > 0 && (
        <section aria-labelledby="competitions" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="competitions" className="text-xl font-bold">
              <InlineContent text={text.t("home.competitionsHeading")} />
            </h2>
            <Link href="/competitions" className="text-sm font-medium text-brand hover:underline">
              {text.t("home.competitionsLink")}
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
              <InlineContent text={text.t("home.resultsHeading")} />
            </h2>
            {resultsIntro && (
              <p className="text-sm text-muted-foreground">
                <InlineContent text={resultsIntro} />
              </p>
            )}
          </div>
          <Link href="/previous-results" className="text-sm font-medium text-brand hover:underline">
            {text.t("home.resultsLink")}
          </Link>
        </div>
        <div className="mt-4">
          <ResultsSummary summary={results.last7} />
        </div>
      </section>

      <LeagueTableSection />

      <section aria-labelledby="trust" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 id="trust" className="text-xl font-bold">
          <InlineContent text={text.t("home.trustHeading")} />
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {TRUST_POINTS.map((point) => (
            <div key={point.title} className="rounded-2xl border border-border bg-card p-5">
              <point.icon aria-hidden className="size-5 text-brand" />
              <h3 className="mt-3 font-semibold">
                <InlineContent text={text.t(point.title)} />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                <InlineContent text={text.t(point.text)} />
              </p>
            </div>
          ))}
        </div>
        {trustLinks && (
          <p className="mt-4 text-sm">
            <InlineContent text={trustLinks} />
          </p>
        )}
        <ResponsibleNotice className="mt-6" />
      </section>
    </>
  );
}
