import Link from "next/link";
import type { Metadata } from "next";
import { getMarketBreakdown, getResultLeagues, getResultWindows, getVerifiedResults } from "@/lib/data/results";
import { ACTIVE_MARKET_KEYS, MARKET_LABELS, isMarketEnabled, isMarketKey } from "@/lib/predictions/markets";
import { marketPageForMarket } from "@/lib/seo/market-pages";
import { formatWinRate } from "@/lib/predictions/stats";
import { formatShortDate, parseDateKey } from "@/lib/utils/date";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ResultsSummary } from "@/components/predictions/results-summary";
import { ResultBadge, predictionHref } from "@/components/predictions/prediction-list";
import { ResponsibleNotice } from "@/components/site/responsible-notice";

const PAGE_SIZE = 50;

type SearchParams = { date?: string; market?: string; league?: string; result?: string; page?: string };

function parseFilters(sp: SearchParams) {
  const page = Math.max(1, Math.min(500, Number.parseInt(sp.page ?? "1", 10) || 1));
  const leagueId = sp.league && /^\d{1,6}$/.test(sp.league) ? Number(sp.league) : null;
  const result = sp.result === "win" || sp.result === "loss" || sp.result === "push" ? sp.result : null;
  return {
    dateKey: parseDateKey(sp.date),
    // DISABLED (correct score): switched-off markets aren't offered as a filter.
    market: isMarketKey(sp.market) && isMarketEnabled(sp.market) ? sp.market : null,
    leagueId,
    result,
    page,
  } as const;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const filtered = Boolean(filters.dateKey || filters.market || filters.leagueId || filters.result || filters.page > 1);
  return pageMetadata({
    title: "Previous Results – Verified Football Prediction Record",
    description:
      "Every free prediction SureMatchContact has published and how it settled — wins, losses and void bets — with win rates for the last 7 days, 30 days and all time.",
    path: "/previous-results",
    // Filtered and paginated views are useful to visitors but are not separate pages for search.
    noIndex: filtered,
  });
}

export default async function PreviousResultsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseFilters(await searchParams);
  const [windows, breakdown, leagues, list] = await Promise.all([
    getResultWindows(filters.market, filters.leagueId),
    getMarketBreakdown(90),
    getResultLeagues(),
    getVerifiedResults({ ...filters, pageSize: PAGE_SIZE }),
  ]);

  const totalPages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));
  const scope = [filters.market ? MARKET_LABELS[filters.market] : null, leagues.find((l) => l.leagueId === filters.leagueId)?.league]
    .filter(Boolean)
    .join(" · ");

  const pageHref = (page: number) => {
    const q = new URLSearchParams();
    if (filters.dateKey) q.set("date", filters.dateKey);
    if (filters.market) q.set("market", filters.market);
    if (filters.leagueId) q.set("league", String(filters.leagueId));
    if (filters.result) q.set("result", filters.result);
    if (page > 1) q.set("page", String(page));
    const s = q.toString();
    return s ? `/previous-results?${s}` : "/previous-results";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: "Previous results", path: "/previous-results" }]} />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Previous Results</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        A complete, public record of the predictions we have published and how they settled — losses included. Picks are shown
        exactly as published before kickoff, and graded automatically against the official final score.{" "}
        <Link href="/methodology#results" className="font-medium text-brand hover:underline">
          How results are verified
        </Link>
      </p>

      <section aria-labelledby="stats" className="mt-8">
        <h2 id="stats" className="text-lg font-bold">
          Performance{scope ? ` · ${scope}` : ""}
        </h2>
        <div className="mt-4 space-y-5">
          <ResultsSummary title="Last 7 days" summary={windows.last7} />
          <ResultsSummary title="Last 30 days" summary={windows.last30} />
          <ResultsSummary title="All time" summary={windows.allTime} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Win rate = wins ÷ (wins + losses). Void bets (postponed or abandoned matches) are excluded from the rate. Pending covers
          matches not yet played and picks that can&apos;t be graded from the score.
        </p>
      </section>

      <section aria-labelledby="filters" className="mt-10">
        <h2 id="filters" className="text-lg font-bold">
          Verified results
        </h2>
        <form method="get" action="/previous-results" className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-5">
          <label className="text-xs font-medium text-muted-foreground">
            Date
            <input
              type="date"
              name="date"
              defaultValue={filters.dateKey ?? ""}
              className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Competition
            <select name="league" defaultValue={filters.leagueId ?? ""} className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground">
              <option value="">All competitions</option>
              {leagues.map((l) => (
                <option key={l.leagueId} value={l.leagueId}>
                  {l.league}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Market
            <select name="market" defaultValue={filters.market ?? ""} className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground">
              <option value="">All markets</option>
              {ACTIVE_MARKET_KEYS.map((m) => (
                <option key={m} value={m}>
                  {MARKET_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Result
            <select name="result" defaultValue={filters.result ?? ""} className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground">
              <option value="">Any result</option>
              <option value="win">Won</option>
              <option value="loss">Lost</option>
              <option value="push">Void</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="h-9 flex-1 rounded-md bg-brand px-3 text-sm font-semibold text-brand-foreground">
              Filter
            </button>
            <Link href="/previous-results" className="flex h-9 items-center rounded-md border border-border px-3 text-sm">
              Reset
            </Link>
          </div>
        </form>

        {list.failed ? (
          <p className="mt-4 text-sm text-muted-foreground">Results are temporarily unavailable. Please try again shortly.</p>
        ) : list.rows.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No verified results match these filters yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <caption className="sr-only">Verified prediction results</caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="px-4 py-2">Date</th>
                  <th scope="col" className="px-4 py-2">Match</th>
                  <th scope="col" className="px-4 py-2">Pick</th>
                  <th scope="col" className="px-4 py-2">Odds</th>
                  <th scope="col" className="px-4 py-2">Score</th>
                  <th scope="col" className="px-4 py-2 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{formatShortDate(r.kickoff_time)}</td>
                    <td className="px-4 py-2.5">
                      <Link href={predictionHref(r)} className="font-medium hover:text-brand">
                        {r.home_team} vs {r.away_team}
                      </Link>
                      {r.league && <span className="block text-xs text-muted-foreground">{r.league}</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.original_prediction_type}
                      {r.original_prediction_type !== r.prediction_type && (
                        <span className="block text-xs text-muted-foreground" title="The pick was edited after kickoff; the published selection is shown.">
                          as published
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{r.original_odds !== null ? Number(r.original_odds).toFixed(2) : "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.home_score !== null && r.away_score !== null ? `${r.home_score}–${r.away_score}` : "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <ResultBadge result={r.result} verified={r.result_approved} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Results pages" className="mt-4 flex items-center justify-between text-sm">
            {filters.page > 1 ? (
              <Link href={pageHref(filters.page - 1)} className="font-medium text-brand hover:underline">
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground">
              Page {filters.page} of {totalPages}
            </span>
            {filters.page < totalPages ? (
              <Link href={pageHref(filters.page + 1)} className="font-medium text-brand hover:underline">
                Older →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>

      {breakdown.length > 0 && (
        <section aria-labelledby="by-market" className="mt-10">
          <h2 id="by-market" className="text-lg font-bold">
            Results by market (last 90 days)
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="px-4 py-2">Market</th>
                  <th scope="col" className="px-4 py-2 text-center">Won</th>
                  <th scope="col" className="px-4 py-2 text-center">Lost</th>
                  <th scope="col" className="px-4 py-2 text-center">Void</th>
                  <th scope="col" className="px-4 py-2 text-center">Pending</th>
                  <th scope="col" className="px-4 py-2 text-right">Win rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {breakdown
                  .sort((a, b) => b.summary.settled - a.summary.settled)
                  .map(({ market, summary }) => {
                    const page = marketPageForMarket(market);
                    return (
                      <tr key={market}>
                        <td className="px-4 py-2.5 font-medium">
                          {page ? (
                            <Link href={`/tips/${page.slug}`} className="hover:text-brand">
                              {MARKET_LABELS[market]}
                            </Link>
                          ) : (
                            MARKET_LABELS[market]
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center tabular-nums">{summary.wins}</td>
                        <td className="px-4 py-2.5 text-center tabular-nums">{summary.losses}</td>
                        <td className="px-4 py-2.5 text-center tabular-nums">{summary.pushes}</td>
                        <td className="px-4 py-2.5 text-center tabular-nums">{summary.pending}</td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{formatWinRate(summary.winRate)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ResponsibleNotice className="mt-10" />
    </div>
  );
}
