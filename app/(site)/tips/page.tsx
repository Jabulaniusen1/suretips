import Link from "next/link";
import type { Metadata } from "next";
import { getPredictionsForDay } from "@/lib/data/predictions";
import { getMarketBreakdown } from "@/lib/data/results";
import { getPublishedCustomPages, isCustomPageIndexable } from "@/lib/data/custom-pages";
import { MARKET_GROUP_ORDER, applyMarketSelection } from "@/lib/seo/market-pages";
import { InlineContent, PlainContent } from "@/components/content/plain-content";
import { getMarketPagesWithText, getSiteText } from "@/lib/content/site-text";
import { MARKET_GROUP_LABEL_KEYS, type SiteText } from "@/lib/content/registry";
import { plainTextOf } from "@/lib/content/plain-text";
import { formatWinRate, type ResultSummary } from "@/lib/predictions/stats";
import { lagosDateKey } from "@/lib/utils/date";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ResponsibleNotice } from "@/components/site/responsible-notice";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const text = await getSiteText();
  return pageMetadata({ title: text.t("tips.seoTitle"), description: text.t("tips.seoDescription"), path: "/tips" });
}

function marketSummary(summary: ResultSummary | undefined, text: SiteText) {
  if (!summary || summary.wins + summary.losses === 0) return text.t("tips.noResults");
  return text.t("tips.stats", { rate: formatWinRate(summary.winRate), settled: summary.wins + summary.losses });
}

export default async function TipsHubPage() {
  const [today, breakdown, customPages, text, markets] = await Promise.all([
    getPredictionsForDay(lagosDateKey()),
    getMarketBreakdown(90),
    getPublishedCustomPages(),
    getSiteText(),
    getMarketPagesWithText(),
  ]);
  const intro = text.t("tips.intro");
  const byMarket = new Map(breakdown.map((b) => [b.market, b.summary]));
  const extraPages = customPages.filter(isCustomPageIndexable);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: text.t("tips.breadcrumb"), path: "/tips" }]} />
      <JsonLd data={itemListJsonLd(plainTextOf(text.t("tips.h1")), markets.pages.map((p) => ({ name: plainTextOf(p.h1), path: `/tips/${p.slug}` })))} />

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
        <InlineContent text={text.t("tips.h1")} />
      </h1>
      {intro && <PlainContent text={intro} className="mt-3 max-w-3xl text-muted-foreground" />}

      {MARKET_GROUP_ORDER.map((group) => {
        const pages = markets.pages.filter((p) => p.group === group);
        const labelKey = MARKET_GROUP_LABEL_KEYS[group];
        if (pages.length === 0) return null;
        return (
          <section key={group} aria-labelledby={`group-${group}`} className="mt-10">
            <h2 id={`group-${group}`} className="text-lg font-bold">
              {labelKey ? <InlineContent text={text.t(labelKey)} /> : group}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page) => {
                const count = applyMarketSelection(today, page.selection).length;
                const stats = page.selection.kind === "markets" && page.selection.markets.length === 1 ? byMarket.get(page.selection.markets[0]) : undefined;
                return (
                  <li key={page.slug}>
                    <Link
                      href={`/tips/${page.slug}`}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand/50"
                    >
                      <span className="font-semibold group-hover:text-brand">{plainTextOf(page.h1)}</span>
                      <span className="mt-1 text-sm text-muted-foreground">{plainTextOf(page.intro)}</span>
                      <span className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {count === 0 ? text.t("cards.noPicksToday") : count === 1 ? text.t("cards.onePickToday") : text.t("cards.picksToday", { count })}
                        </span>
                        {page.selection.kind === "markets" && page.selection.markets.length === 1 && <span>{marketSummary(stats, text)}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {extraPages.length > 0 && (
        <section aria-labelledby="more-guides" className="mt-10">
          <h2 id="more-guides" className="text-lg font-bold">
            <InlineContent text={text.t("tips.moreGuides")} />
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {extraPages.map((page) => (
              <li key={page.id}>
                <Link href={`/tips/${page.slug}`} className="text-sm font-medium text-brand hover:underline">
                  {page.heading || page.title}
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
