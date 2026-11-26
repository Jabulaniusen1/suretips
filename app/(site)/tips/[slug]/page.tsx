import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPredictionsForDay, getRecentVerifiedResults, type PublicPrediction } from "@/lib/data/predictions";
import { getResultWindows } from "@/lib/data/results";
import { getCompetitionsByLeagueId } from "@/lib/data/competitions";
import { getCustomPageBySlug, getMarketPageOverride, isCustomPageIndexable } from "@/lib/data/custom-pages";
import {
  applyMarketPageOverride,
  applyMarketSelection,
  getMarketPage,
  isRankedSelection,
  stripBrandSuffix,
  type MarketPage,
  type MarketSelection,
  type ResolvedMarketPage,
} from "@/lib/seo/market-pages";
import { MARKET_LABELS, isMarketKey, type MarketKey } from "@/lib/predictions/markets";
import { getDateRange, formatShortDate, isOtherDayView, lagosDateKey, type DateRange } from "@/lib/utils/date";
import { pageMetadata, parseKeywords, truncateDescription } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { MarketNav } from "@/components/predictions/market-nav";
import { DateNav } from "@/components/predictions/date-nav";
import { PredictionList, ResultBadge, predictionHref } from "@/components/predictions/prediction-list";
import { ResultsSummary } from "@/components/predictions/results-summary";
import { FaqSection } from "@/components/content/faq-section";
import { InlineContent, PlainContent } from "@/components/content/plain-content";
import { getMarketPagesWithText, getSiteText } from "@/lib/content/site-text";
import type { SiteText } from "@/lib/content/registry";
import { plainTextOf } from "@/lib/content/plain-text";
import { ResponsibleNotice } from "@/components/site/responsible-notice";
import type { Tables } from "@/types/database";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; date?: string }>;
};

// Legacy custom_pages.filter_id values -> selections.
const LEGACY_FILTERS: Record<string, MarketSelection> = {
  free: { kind: "top-picks" },
  super_single: { kind: "super-single" },
  double_chance: { kind: "markets", markets: ["double_chance", "double_chance_12"] },
  home_win: { kind: "markets", markets: ["home_win"] },
  away_win: { kind: "markets", markets: ["away_win"] },
  over_1_5: { kind: "markets", markets: ["over_1_5"] },
  over_2_5: { kind: "markets", markets: ["over_2_5"] },
  btts: { kind: "markets", markets: ["btts"] },
};

function customPageSelection(filterId: string | null): MarketSelection | null {
  if (!filterId || filterId === "all") return null;
  return getMarketPage(filterId)?.selection ?? LEGACY_FILTERS[filterId] ?? (isMarketKey(filterId) ? { kind: "markets", markets: [filterId] } : null);
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { period, date } = await searchParams;
  const otherDay = isOtherDayView(period, date);

  const builtIn = (await getMarketPagesWithText()).bySlug(slug);
  if (builtIn) {
    const market = applyMarketPageOverride(builtIn, await getMarketPageOverride(slug));
    return pageMetadata({
      title: market.title,
      description: truncateDescription(market.description),
      path: `/tips/${slug}`,
      image: market.ogImage ? { url: market.ogImage, alt: plainTextOf(market.h1) } : undefined,
      noIndex: market.noIndex || otherDay,
      keywords: parseKeywords(market.metaKeywords),
    });
  }

  const page = await getCustomPageBySlug(slug);
  if (!page) notFound();

  return pageMetadata({
    title: stripBrandSuffix(page.meta_title || page.heading || page.title),
    description: truncateDescription(page.meta_description || page.introduction || page.description || page.title),
    path: page.canonical_url || `/tips/${slug}`,
    image: page.og_image ? { url: page.og_image, alt: page.heading || page.title } : undefined,
    noIndex: !isCustomPageIndexable(page) || otherDay,
    keywords: parseKeywords(page.meta_keywords),
  });
}

export default async function TipsMarketPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { period, date } = await searchParams;
  const range = getDateRange(period, date);

  const builtIn = (await getMarketPagesWithText()).bySlug(slug);
  if (builtIn) {
    const market = applyMarketPageOverride(builtIn, await getMarketPageOverride(slug));
    return <BuiltInMarketPage page={market} range={range} />;
  }

  const custom = await getCustomPageBySlug(slug);
  if (!custom) notFound();
  return <CustomSeoPage page={custom} range={range} />;
}

// ---------------------------------------------------------------------------

function singleMarket(page: MarketPage): MarketKey | null {
  return page.selection.kind === "markets" ? page.selection.markets[0] : null;
}

async function BuiltInMarketPage({ page, range }: { page: ResolvedMarketPage; range: DateRange }) {
  const marketKey = singleMarket(page);
  const marketList = page.selection.kind === "markets" ? page.selection.markets : undefined;

  const [dayPredictions, windows, recent, competitionsByLeague, text, markets] = await Promise.all([
    getPredictionsForDay(range.dateKey),
    getResultWindows(marketKey),
    getRecentVerifiedResults({ markets: marketList, limit: 8 }),
    getCompetitionsByLeagueId(),
    getSiteText(),
    getMarketPagesWithText(),
  ]);

  const predictions = applyMarketSelection(dayPredictions, page.selection);
  const isToday = range.dateKey === lagosDateKey();
  const statsLabel = marketKey ? MARKET_LABELS[marketKey] : text.t("marketPage.allTipsLabel");
  const market = plainTextOf(page.tabLabel);
  const methodologyLink = text.t("marketPage.methodologyLink");
  const recordIntro = text.t("marketPage.recordIntro", { market: statsLabel });
  const relatedCompetitions = [...new Set(predictions.map((p) => p.league_id).filter((id): id is number => Boolean(id)))]
    .map((id) => competitionsByLeague.get(id))
    .filter((c): c is Tables<"competitions"> => Boolean(c));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: text.t("tips.breadcrumb"), path: "/tips" }, { name: market, path: `/tips/${page.slug}` }]} />

      <header className="mt-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <InlineContent text={page.h1} />
        </h1>
        <PlainContent text={page.intro} className="mt-3 max-w-3xl text-muted-foreground" />
      </header>

      <div className="mt-6">
        <MarketNav active={page.slug} />
      </div>

      <section aria-labelledby="picks" className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="picks" className="text-lg font-bold">
              <InlineContent text={isToday ? text.t("marketPage.todayPicks", { market }) : text.t("marketPage.datePicks", { market, date: range.label })} />
            </h2>
            <p className="text-sm text-muted-foreground">{range.label}</p>
          </div>
          <DateNav active={range.period} basePath={`/tips/${page.slug}`} dateKey={range.dateKey} dateLabel={range.label} />
        </div>
        <div className="mt-4">
          <PredictionList
            predictions={predictions}
            groupByCompetition={!isRankedSelection(page.selection)}
            emptyState={<MarketEmptyState page={page} range={range} text={text} />}
          />
        </div>
      </section>

      <section aria-labelledby="explainer" className="mt-10">
        <h2 id="explainer" className="text-lg font-bold">
          <InlineContent text={page.explainer.heading} />
        </h2>
        <PlainContent text={page.explainer.paragraphs.join("\n\n")} className="mt-3 space-y-3 text-muted-foreground" />
      </section>

      {page.mainContent && <PlainContent text={page.mainContent} className="mt-6 text-muted-foreground" />}

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="how-selected">
          <h2 id="how-selected" className="text-lg font-bold">
            <InlineContent text={text.t("marketPage.howSelectedHeading")} />
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {page.howSelected.map((item) => (
              <li key={item}>
                <InlineContent text={item} />
              </li>
            ))}
          </ul>
          {methodologyLink && (
            <p className="mt-3 text-sm">
              <InlineContent text={methodologyLink} />
            </p>
          )}
        </section>
        <section aria-labelledby="factors">
          <h2 id="factors" className="text-lg font-bold">
            <InlineContent text={text.t("marketPage.factorsHeading")} />
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {page.factors.map((item) => (
              <li key={item}>
                <InlineContent text={item} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="performance" className="mt-10">
        <h2 id="performance" className="text-lg font-bold">
          <InlineContent text={marketKey ? text.t("marketPage.recordHeading", { market: statsLabel }) : text.t("marketPage.recordHeadingAll")} />
        </h2>
        {recordIntro && (
          <p className="mt-1 text-sm text-muted-foreground">
            <InlineContent text={recordIntro} />
          </p>
        )}
        <div className="mt-4 space-y-4">
          <ResultsSummary title={text.t("results.last30")} summary={windows.last30} />
          <ResultsSummary title={text.t("results.allTime")} summary={windows.allTime} />
        </div>
        {recent.length > 0 && <RecentResults rows={recent} heading={text.t("marketPage.latestResults")} />}
        <p className="mt-3 text-sm">
          <Link
            href={marketKey ? `/previous-results?market=${marketKey}` : "/previous-results"}
            className="font-medium text-brand hover:underline"
          >
            {text.t("marketPage.seeAll", { market: statsLabel })}
          </Link>
        </p>
      </section>

      <section aria-labelledby="limitations" className="mt-10 rounded-2xl border border-border bg-muted/40 p-5">
        <h2 id="limitations" className="font-bold">
          <InlineContent text={text.t("marketPage.limitationsHeading")} />
        </h2>
        <PlainContent text={page.limitations} className="mt-2 text-sm text-muted-foreground" />
      </section>

      <FaqSection items={page.faqs} heading={text.t("marketPage.faqHeading", { market })} />

      <RelatedLinks page={page} competitions={relatedCompetitions} text={text} related={page.related.map(markets.bySlug).filter((p): p is MarketPage => Boolean(p))} />

      <ResponsibleNotice className="mt-10" />
    </div>
  );
}

function MarketEmptyState({ page, range, text }: { page: MarketPage; range: DateRange; text: SiteText }) {
  const key = page.selection.kind === "super-single" ? "marketPage.emptySuperSingle" : "marketPage.empty";
  return <InlineContent text={text.t(key, { market: plainTextOf(page.tabLabel), date: range.label, tomorrowLink: `/tips/${page.slug}?period=tomorrow` })} />;
}

function RecentResults({ rows, heading }: { rows: PublicPrediction[]; heading: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
      <h3 className="border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {heading}
      </h3>
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={predictionHref(r)} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-muted/50">
              <span className="min-w-0">
                <span className="font-medium">
                  {r.home_team} {r.home_score ?? "–"}–{r.away_score ?? "–"} {r.away_team}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatShortDate(r.kickoff_time)} · {r.original_prediction_type}
                  {r.original_odds !== null ? ` @ ${Number(r.original_odds).toFixed(2)}` : ""}
                </span>
              </span>
              <ResultBadge result={r.result} verified={r.result_approved} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedLinks({
  page,
  competitions,
  related,
  text,
}: {
  page: MarketPage;
  competitions: Tables<"competitions">[];
  related: MarketPage[];
  text: SiteText;
}) {
  return (
    <section aria-labelledby="related" className="mt-10 grid gap-8 md:grid-cols-2">
      <div>
        <h2 id="related" className="text-lg font-bold">
          <InlineContent text={text.t("marketPage.relatedHeading")} />
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {related.map((r) => (
            <li key={r.slug}>
              <Link href={`/tips/${r.slug}`} className="font-medium text-brand hover:underline">
                {plainTextOf(r.h1)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-bold">
          <InlineContent text={text.t("marketPage.competitionsHeading", { market: plainTextOf(page.tabLabel) })} />
        </h2>
        {competitions.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm">
            {competitions.map((c) => (
              <li key={c.id}>
                <Link href={`/competitions/${c.slug}`} className="font-medium text-brand hover:underline">
                  {text.t("marketPage.competitionLink", { competition: c.name })}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            <InlineContent text={text.t("marketPage.noCompetitions")} />
          </p>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

async function CustomSeoPage({ page, range }: { page: Tables<"custom_pages">; range: DateRange }) {
  const selection = customPageSelection(page.filter_id);
  const [dayPredictions, text] = await Promise.all([getPredictionsForDay(range.dateKey), getSiteText()]);
  const predictions = selection ? applyMarketSelection(dayPredictions, selection) : dayPredictions;
  const heading = page.heading || page.title;
  const intro = page.introduction || page.description;
  const relatedLinks = (page.related_links ?? []).filter((l) => l.label && /^\/[a-z0-9/_-]*$/i.test(l.href));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: text.t("tips.breadcrumb"), path: "/tips" }, { name: page.title, path: `/tips/${page.slug}` }]} />
      <header className="mt-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{heading}</h1>
        {page.subheading && <p className="mt-2 font-medium text-muted-foreground">{page.subheading}</p>}
        {intro && <PlainContent text={intro} className="mt-3 max-w-3xl text-muted-foreground" />}
      </header>

      <section aria-labelledby="picks" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="picks" className="text-lg font-bold">
            <InlineContent text={text.t("seoPage.picks", { date: range.label })} />
          </h2>
          <DateNav active={range.period} basePath={`/tips/${page.slug}`} dateKey={range.dateKey} dateLabel={range.label} />
        </div>
        <div className="mt-4">
          <PredictionList predictions={predictions} emptyState={<InlineContent text={text.t("seoPage.empty", { date: range.label })} />} />
        </div>
      </section>

      {page.main_content && <PlainContent text={page.main_content} className="mt-10 text-muted-foreground" />}

      <FaqSection items={page.faq ?? []} />

      {relatedLinks.length > 0 && (
        <section aria-labelledby="related" className="mt-10">
          <h2 id="related" className="text-lg font-bold">
            <InlineContent text={text.t("seoPage.related")} />
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {relatedLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-medium text-brand hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ResponsibleNotice className="mt-10" />
    </div>
  );
}
