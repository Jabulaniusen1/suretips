import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { getCompetitionBySlug } from "@/lib/data/competitions";
import { getRecentVerifiedResults, getUpcomingLeaguePredictions } from "@/lib/data/predictions";
import { getResultWindows } from "@/lib/data/results";
import { getPostsForCompetition } from "@/lib/data/blog";
import {
  FINISHED_STATUSES,
  VOID_STATUSES,
  attempt,
  currentFootballSeason,
  getLeagueFixtures,
  getStandingGroups,
  type FixtureSummary,
  type StandingRow,
} from "@/lib/football-api";
import { addDaysToKey, formatDayMonth, formatKickoffTime, formatShortDate, lagosDateKey } from "@/lib/utils/date";
import { itemListJsonLd, pageMetadata, truncateDescription } from "@/lib/seo";
import { getMarketPage } from "@/lib/seo/market-pages";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PredictionList, ResultBadge, predictionHref } from "@/components/predictions/prediction-list";
import { ResultsSummary } from "@/components/predictions/results-summary";
import { PlainContent } from "@/components/content/plain-content";
import { ResponsibleNotice } from "@/components/site/responsible-notice";

export const revalidate = 600;

/** Render each URL on first visit, then serve it from the ISR cache. */
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

const COMPETITION_MARKETS = ["over-2-5", "btts", "home-win", "double-chance", "under-2-5", "over-1-5"];
const MIN_INTRO_LENGTH = 200;

async function load(slug: string) {
  const competition = await getCompetitionBySlug(slug);
  if (!competition) notFound();
  const predictions = competition.league_id ? await getUpcomingLeaguePredictions(competition.league_id, 40) : [];
  return { competition, predictions };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { competition, predictions } = await load(slug);
  const introLength = (competition.introduction ?? "").trim().length;

  return pageMetadata({
    title: competition.seo_title || `${competition.name} Predictions Today – Fixtures, Table & Tips`,
    description: truncateDescription(
      competition.seo_description ||
        `Free ${competition.name} predictions with upcoming fixtures, the current table, team form and a transparent record of every published tip.`
    ),
    path: `/competitions/${slug}`,
    image: competition.og_image ? { url: competition.og_image, alt: `${competition.name} predictions` } : undefined,
    // Thin hubs (no editorial intro and nothing published) stay out of the index.
    noIndex: introLength < MIN_INTRO_LENGTH && predictions.length === 0,
  });
}

export default async function CompetitionPage({ params }: Props) {
  const { slug } = await params;
  const { competition, predictions } = await load(slug);
  const leagueId = competition.league_id;
  const season = competition.current_season ?? currentFootballSeason(leagueId);
  const today = lagosDateKey();

  const [fixtures, standings, windows, recentResults, posts] = await Promise.all([
    leagueId
      ? attempt(`league fixtures ${leagueId}`, () => getLeagueFixtures(leagueId, season, addDaysToKey(today, -7), addDaysToKey(today, 10)), [] as FixtureSummary[])
      : Promise.resolve({ data: [] as FixtureSummary[], failed: false }),
    leagueId ? attempt(`standings ${leagueId}`, () => getStandingGroups(leagueId, season), [] as StandingRow[][]) : Promise.resolve({ data: [] as StandingRow[][], failed: false }),
    leagueId ? getResultWindows(null, leagueId) : Promise.resolve(null),
    leagueId ? getRecentVerifiedResults({ leagueId, limit: 6 }) : Promise.resolve([]),
    getPostsForCompetition(competition.id, 3),
  ]);

  const predictedFixtureIds = new Set(predictions.map((p) => p.external_fixture_id).filter(Boolean));
  const upcoming = fixtures.data
    .filter((f) => !FINISHED_STATUSES.has(f.fixture.status.short) && !VOID_STATUSES.has(f.fixture.status.short))
    .sort((a, b) => a.fixture.date.localeCompare(b.fixture.date))
    .slice(0, 12);
  const recent = fixtures.data
    .filter((f) => FINISHED_STATUSES.has(f.fixture.status.short))
    .sort((a, b) => b.fixture.date.localeCompare(a.fixture.date))
    .slice(0, 10);

  const heading = competition.heading || `${competition.name} Predictions`;
  const marketPages = COMPETITION_MARKETS.map(getMarketPage).filter((p) => p !== undefined);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: "Competitions", path: "/competitions" }, { name: competition.name, path: `/competitions/${slug}` }]} />
      <JsonLd
        data={itemListJsonLd(
          `${competition.name} predictions`,
          [...new Map(predictions.filter((p) => p.external_fixture_id).map((p) => [p.external_fixture_id, p])).values()].map((p) => ({
            name: `${p.home_team} vs ${p.away_team} prediction`,
            path: predictionHref(p),
          }))
        )}
      />

      <header className="mt-4 flex items-start gap-4">
        {leagueId ? (
          <Image
            src={`https://media.api-sports.io/football/leagues/${leagueId}.png`}
            alt={`${competition.name} logo`}
            width={56}
            height={56}
            className="size-14 shrink-0 object-contain"
            priority
          />
        ) : (
          <Trophy aria-hidden className="size-12 shrink-0 text-muted-foreground" />
        )}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{heading}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[competition.country, competition.competition_type === "cup" ? "Cup competition" : competition.competition_type === "league" ? "League" : null, `Season ${season}/${String(season + 1).slice(2)}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </header>
      {competition.subheading && <p className="mt-4 font-medium">{competition.subheading}</p>}
      {competition.introduction && <PlainContent text={competition.introduction} className="mt-3 max-w-3xl text-muted-foreground" />}

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section aria-labelledby="comp-predictions">
            <h2 id="comp-predictions" className="text-lg font-bold">
              Upcoming {competition.name} predictions
            </h2>
            <div className="mt-3">
              <PredictionList
                predictions={predictions}
                showDate
                groupByCompetition={false}
                emptyState={
                  <>
                    No {competition.name} predictions are published for the coming days yet. Picks are added the day before kickoff —
                    meanwhile see the fixtures below or{" "}
                    <Link href="/" className="font-medium text-brand hover:underline">
                      today&apos;s predictions
                    </Link>
                    .
                  </>
                }
              />
            </div>
          </section>

          <section aria-labelledby="fixtures">
            <h2 id="fixtures" className="text-lg font-bold">
              {competition.name} fixtures
            </h2>
            {fixtures.failed ? (
              <p className="mt-2 text-sm text-muted-foreground">Fixtures are temporarily unavailable from our data provider.</p>
            ) : upcoming.length > 0 ? (
              <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {upcoming.map((f) => (
                  <li key={f.fixture.id}>
                    <Link href={`/match/${f.fixture.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50">
                      <span className="w-16 shrink-0 text-xs text-muted-foreground">
                        {formatDayMonth(f.fixture.date)}
                        <br />
                        {formatKickoffTime(f.fixture.date)}
                      </span>
                      <span className="min-w-0 flex-1 font-medium">
                        {f.teams.home.name} vs {f.teams.away.name}
                      </span>
                      {predictedFixtureIds.has(f.fixture.id) && (
                        <span className="shrink-0 rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">Tips</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No {competition.name} fixtures are scheduled in the next ten days.</p>
            )}
          </section>

          {recent.length > 0 && (
            <section aria-labelledby="recent-fixtures">
              <h2 id="recent-fixtures" className="text-lg font-bold">
                Recent {competition.name} results
              </h2>
              <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {recent.map((f) => (
                  <li key={f.fixture.id}>
                    <Link href={`/match/${f.fixture.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-muted/50">
                      <span className="min-w-0">
                        {f.teams.home.name}{" "}
                        <strong className="tabular-nums">
                          {f.goals.home}–{f.goals.away}
                        </strong>{" "}
                        {f.teams.away.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatShortDate(f.fixture.date)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {competition.main_content && <PlainContent text={competition.main_content} className="text-muted-foreground" />}

          {windows && (
            <section aria-labelledby="comp-record">
              <h2 id="comp-record" className="text-lg font-bold">
                Our {competition.name} record
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Verified results of every {competition.name} tip we have published.</p>
              <div className="mt-3 space-y-4">
                <ResultsSummary title="Last 30 days" summary={windows.last30} />
                <ResultsSummary title="All time" summary={windows.allTime} />
              </div>
              {recentResults.length > 0 && (
                <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {recentResults.map((r) => (
                    <li key={r.id}>
                      <Link href={predictionHref(r)} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-muted/50">
                        <span className="min-w-0">
                          {r.home_team} vs {r.away_team}
                          <span className="ml-2 text-xs text-muted-foreground">{r.original_prediction_type}</span>
                        </span>
                        <ResultBadge result={r.result} verified={r.result_approved} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-8">
          {standings.data.length > 0 && (
            <section aria-labelledby="table">
              <h2 id="table" className="text-lg font-bold">
                {competition.name} table
              </h2>
              {standings.data.slice(0, 4).map((group, i) => (
                <StandingsGroup key={i} rows={group} compact={standings.data.length > 1} />
              ))}
            </section>
          )}
          {standings.failed && <p className="text-sm text-muted-foreground">The league table is temporarily unavailable.</p>}

          <section aria-labelledby="comp-markets">
            <h2 id="comp-markets" className="text-lg font-bold">
              Betting markets
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {marketPages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/tips/${page.slug}`} className="font-medium text-brand hover:underline">
                    {page.h1}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {posts.length > 0 && (
            <section aria-labelledby="comp-posts">
              <h2 id="comp-posts" className="text-lg font-bold">
                {competition.name} analysis
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link href={`/blog/${post.slug}`} className="font-medium text-brand hover:underline">
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <ResponsibleNotice className="mt-10" />
    </div>
  );
}

function StandingsGroup({ rows, compact }: { rows: StandingRow[]; compact: boolean }) {
  const shown = compact ? rows : rows.slice(0, 20);
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
      {compact && rows[0]?.group && <p className="border-b border-border px-3 py-1.5 text-xs font-semibold">{rows[0].group}</p>}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left uppercase text-muted-foreground">
            <th scope="col" className="py-1.5 pl-3">#</th>
            <th scope="col" className="py-1.5">Team</th>
            <th scope="col" className="py-1.5 text-center">P</th>
            <th scope="col" className="py-1.5 text-center">GD</th>
            <th scope="col" className="py-1.5 pr-3 text-center">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {shown.map((r) => (
            <tr key={r.team.id}>
              <td className="py-1.5 pl-3">{r.rank}</td>
              <td className="max-w-[9rem] truncate py-1.5 font-medium">{r.team.name}</td>
              <td className="py-1.5 text-center">{r.all.played}</td>
              <td className="py-1.5 text-center">{r.goalsDiff}</td>
              <td className="py-1.5 pr-3 text-center font-bold">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
