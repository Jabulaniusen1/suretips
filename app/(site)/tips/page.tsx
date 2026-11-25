import Link from "next/link";
import type { Metadata } from "next";
import { getPredictionsForDay } from "@/lib/data/predictions";
import { getMarketBreakdown } from "@/lib/data/results";
import { getPublishedCustomPages, isCustomPageIndexable } from "@/lib/data/custom-pages";
import { MARKET_GROUP_ORDER, MARKET_PAGES, applyMarketSelection } from "@/lib/seo/market-pages";
import { formatWinRate, type ResultSummary } from "@/lib/predictions/stats";
import { lagosDateKey } from "@/lib/utils/date";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ResponsibleNotice } from "@/components/site/responsible-notice";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Football Betting Tips by Market – Goals, BTTS, 1X2",
  description:
    // DISABLED (correct score): was "... match result, double chance and correct score — ..."
    "Free football betting tips by market: over/under goals, both teams to score, match result and double chance — with today's picks and verified results.",
  path: "/tips",
});

function marketSummary(summary: ResultSummary | undefined) {
  if (!summary || summary.wins + summary.losses === 0) return "No verified results yet";
  return `${formatWinRate(summary.winRate)} win rate · ${summary.wins + summary.losses} settled (90 days)`;
}

export default async function TipsHubPage() {
  const [today, breakdown, customPages] = await Promise.all([
    getPredictionsForDay(lagosDateKey()),
    getMarketBreakdown(90),
    getPublishedCustomPages(),
  ]);
  const byMarket = new Map(breakdown.map((b) => [b.market, b.summary]));
  const extraPages = customPages.filter(isCustomPageIndexable);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: "Tips by market", path: "/tips" }]} />
      <JsonLd data={itemListJsonLd("Football betting tips by market", MARKET_PAGES.map((p) => ({ name: p.h1, path: `/tips/${p.slug}` })))} />

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Football Betting Tips by Market</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Every free prediction on Sure Match Tips belongs to a betting market. Choose a market to see today&apos;s picks, how they
        are selected, what to consider before betting, and how that market&apos;s published tips have performed. For every market
        at once, see <Link href="/" className="font-medium text-brand hover:underline">today&apos;s football predictions</Link>.
      </p>

      {MARKET_GROUP_ORDER.map((group) => {
        const pages = MARKET_PAGES.filter((p) => p.group === group);
        if (pages.length === 0) return null;
        return (
          <section key={group} aria-labelledby={`group-${group}`} className="mt-10">
            <h2 id={`group-${group}`} className="text-lg font-bold">
              {group}
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
                      <span className="font-semibold group-hover:text-brand">{page.h1}</span>
                      <span className="mt-1 text-sm text-muted-foreground">{page.intro}</span>
                      <span className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {count > 0 ? `${count} ${count === 1 ? "pick" : "picks"} today` : "No picks yet today"}
                        </span>
                        {page.selection.kind === "markets" && page.selection.markets.length === 1 && <span>{marketSummary(stats)}</span>}
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
            More prediction guides
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
