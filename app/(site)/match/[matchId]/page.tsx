import { cache } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Shield } from "lucide-react";
import {
  attempt,
  FINISHED_STATUSES,
  LIVE_STATUSES,
  VOID_STATUSES,
  getFixtureById,
  getH2H,
  getStandings,
  getTeamRecentFixtures,
  seasonForDate,
  type FixtureSummary,
  type StandingRow,
} from "@/lib/football-api";
import { getPredictionsByFixture, getRelatedFixturePredictions, type PublicPrediction } from "@/lib/data/predictions";
import { getCompetitionsByLeagueId } from "@/lib/data/competitions";
import { MARKET_LABELS, marketOf } from "@/lib/predictions/markets";
import { marketPageForMarket, type MarketPage } from "@/lib/seo/market-pages";
import { average, summarizeForm, summarizeH2H, teamForm, isCompleted, type FormEntry } from "@/lib/predictions/match-stats";
import { formatKickoffFull, formatKickoffTime, formatShortDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { pageMetadata, sportsEventJsonLd, truncateDescription } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PlainContent } from "@/components/content/plain-content";
import { JsonLd } from "@/components/seo/json-ld";
import { ResultBadge, predictionHref } from "@/components/predictions/prediction-list";
import { ResponsibleNotice } from "@/components/site/responsible-notice";

export const revalidate = 120;

/** Render each URL on first visit, then serve it from the ISR cache. */
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ matchId: string }> };

interface MatchCore {
  id: number;
  fixture: FixtureSummary | null;
  /** True when API-Sports could not be reached -- not the same as "no fixture". */
  apiFailed: boolean;
  predictions: PublicPrediction[];
  home: { id: number | null; name: string; logo: string | null };
  away: { id: number | null; name: string; logo: string | null };
  league: { id: number | null; name: string | null; round: string | null; season: number | null };
  kickoff: string;
  statusShort: string;
}

/**
 * Resolves a fixture from the API, falling back to stored predictions.
 * - unknown fixture with no stored predictions -> 404
 * - API unavailable and nothing stored -> error (500), so a temporary outage
 *   is never reported to crawlers as a missing page
 */
const loadMatch = cache(async (matchId: string): Promise<MatchCore> => {
  if (!/^\d{1,10}$/.test(matchId)) notFound();
  const id = Number(matchId);

  const [predictions, api] = await Promise.all([getPredictionsByFixture(id), attempt(`fixture ${id}`, () => getFixtureById(id, 60), null)]);
  const fixture = api.data;

  if (!fixture && predictions.length === 0) {
    if (api.failed) throw new Error(`Match data for fixture ${id} is temporarily unavailable`);
    notFound();
  }

  const stored = predictions[0];
  return {
    id,
    fixture,
    apiFailed: api.failed,
    predictions,
    home: fixture
      ? { id: fixture.teams.home.id, name: fixture.teams.home.name, logo: fixture.teams.home.logo }
      : { id: null, name: stored.home_team, logo: stored.home_team_logo },
    away: fixture
      ? { id: fixture.teams.away.id, name: fixture.teams.away.name, logo: fixture.teams.away.logo }
      : { id: null, name: stored.away_team, logo: stored.away_team_logo },
    league: fixture
      ? { id: fixture.league.id, name: fixture.league.name, round: fixture.league.round ?? null, season: fixture.league.season ?? null }
      : { id: stored.league_id, name: stored.league, round: null, season: null },
    kickoff: fixture?.fixture.date ?? stored.kickoff_time,
    statusShort: fixture?.fixture.status.short ?? (stored.status === "finished" ? "FT" : stored.status === "live" ? "LIVE" : "NS"),
  };
});

function topPick(predictions: PublicPrediction[]): PublicPrediction | undefined {
  return [...predictions].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchId } = await params;
  const match = await loadMatch(matchId);
  const date = formatShortDate(match.kickoff);
  const pick = topPick(match.predictions);
  const fixtureName = `${match.home.name} vs ${match.away.name}`;

  const description = pick
    ? `${fixtureName} prediction for ${date}${match.league.name ? ` (${match.league.name})` : ""}: ${match.predictions.length} free ${
        match.predictions.length === 1 ? "tip" : "tips"
      } including ${pick.prediction_type}, plus head-to-head record, recent form and league position.`
    : `${fixtureName}${match.league.name ? `, ${match.league.name}` : ""}, ${date}: head-to-head record, recent form, league position and kickoff time.`;

  return pageMetadata({
    title: `${fixtureName} Prediction & H2H – ${date}`,
    description: truncateDescription(description),
    path: `/match/${match.id}`,
    type: "article",
    modifiedTime: match.predictions.map((p) => p.updated_at).sort().at(-1),
    // Only matches we actually publish a prediction for are indexable.
    noIndex: match.predictions.length === 0,
  });
}

export default async function MatchPage({ params }: Props) {
  const { matchId } = await params;
  const match = await loadMatch(matchId);
  const { fixture, home, away } = match;
  const season = match.league.season ?? (match.league.id ? seasonForDate(new Date(match.kickoff), match.league.id) : null);

  const [h2h, homeRecent, awayRecent, standings, related, competitions] = await Promise.all([
    home.id && away.id ? attempt("h2h", () => getH2H(home.id!, away.id!, 10), []) : Promise.resolve({ data: [], failed: false }),
    home.id ? attempt("home form", () => getTeamRecentFixtures(home.id!, 6), []) : Promise.resolve({ data: [], failed: false }),
    away.id ? attempt("away form", () => getTeamRecentFixtures(away.id!, 6), []) : Promise.resolve({ data: [], failed: false }),
    match.league.id && season ? attempt("standings", () => getStandings(match.league.id!, season), null) : Promise.resolve({ data: null, failed: false }),
    getRelatedFixturePredictions(match.league.id, match.kickoff, match.id),
    getCompetitionsByLeagueId(),
  ]);

  const competition = match.league.id ? competitions.get(match.league.id) : undefined;
  const h2hMatches = h2h.data.filter(isCompleted).sort((a, b) => b.fixture.date.localeCompare(a.fixture.date));
  const h2hSummary = home.id ? summarizeH2H(home.id, h2hMatches) : null;
  const homeForm = home.id ? teamForm(home.id, homeRecent.data.filter((f) => f.fixture.id !== match.id)) : [];
  const awayForm = away.id ? teamForm(away.id, awayRecent.data.filter((f) => f.fixture.id !== match.id)) : [];
  const homeRow = standings.data?.find((r) => r.team.id === home.id);
  const awayRow = standings.data?.find((r) => r.team.id === away.id);
  const statsUnavailable = match.apiFailed || h2h.failed || homeRecent.failed || awayRecent.failed;

  const status = match.statusShort;
  const isLive = LIVE_STATUSES.has(status);
  const isFinished = FINISHED_STATUSES.has(status);
  const score = fixture ? fixture.goals : { home: match.predictions[0]?.home_score ?? null, away: match.predictions[0]?.away_score ?? null };
  const showScore = (isLive || isFinished) && score.home !== null && score.away !== null;
  const fixtureName = `${home.name} vs ${away.name}`;

  const marketPages = [
    ...new Map(
      match.predictions
        .map((p) => marketOf(p))
        .filter((m) => m !== null)
        .map((m) => marketPageForMarket(m))
        .filter((p): p is MarketPage => Boolean(p))
        .map((p) => [p.slug, p])
    ).values(),
  ];

  const relatedFixtures = [...new Map(related.filter((p) => p.external_fixture_id).map((p) => [p.external_fixture_id, p])).values()].slice(0, 8);

  const crumbs = [
    ...(competition ? [{ name: competition.name, path: `/competitions/${competition.slug}` }] : [{ name: "Predictions", path: "/predictions" }]),
    { name: fixtureName, path: `/match/${match.id}` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={crumbs} />
      <JsonLd
        data={sportsEventJsonLd({
          name: fixtureName,
          description: `${fixtureName}${match.league.name ? ` – ${match.league.name}` : ""}`,
          path: `/match/${match.id}`,
          startDate: match.kickoff,
          statusShort: status,
          venue: fixture?.fixture.venue ? { name: fixture.fixture.venue.name, city: fixture.fixture.venue.city } : null,
          homeTeam: { name: home.name, logo: home.logo },
          awayTeam: { name: away.name, logo: away.logo },
          competition: match.league.name,
        })}
      />

      <header className="mt-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-sm text-muted-foreground">
          {competition ? (
            <Link href={`/competitions/${competition.slug}`} className="font-medium text-brand hover:underline">
              {competition.name}
            </Link>
          ) : (
            match.league.name
          )}
          {match.league.round ? ` · ${match.league.round}` : ""}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{fixtureName} Prediction</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <time dateTime={match.kickoff}>{formatKickoffFull(match.kickoff)}</time>
          {fixture?.fixture.venue?.name ? ` · ${fixture.fixture.venue.name}${fixture.fixture.venue.city ? `, ${fixture.fixture.venue.city}` : ""}` : ""}
        </p>

        <div className="mt-6 flex items-center justify-center gap-4 sm:gap-10">
          <TeamCrest name={home.name} logo={home.logo} />
          <div className="text-center">
            {showScore ? (
              <p className={cn("text-3xl font-extrabold tabular-nums", isLive && "text-brand")}>
                {score.home} – {score.away}
              </p>
            ) : (
              <p className="text-xl font-bold text-muted-foreground">{formatKickoffTime(match.kickoff)}</p>
            )}
            <p className={cn("mt-1 text-xs font-semibold uppercase tracking-wide", isLive ? "text-brand" : "text-muted-foreground")}>
              {statusLabel(status, fixture)}
            </p>
          </div>
          <TeamCrest name={away.name} logo={away.logo} />
        </div>
      </header>

      <section aria-labelledby="our-predictions" className="mt-8">
        <h2 id="our-predictions" className="text-lg font-bold">
          {fixtureName} predictions
        </h2>
        {match.predictions.length > 0 ? (
          <>
            <PredictionSummary match={match} h2h={h2hSummary} homeForm={homeForm} awayForm={awayForm} />
            <PredictionsTable predictions={match.predictions} />
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            We haven&apos;t published a prediction for this match. The statistics below are provided for reference — see{" "}
            <Link href="/" className="font-medium text-brand hover:underline">
              today&apos;s predictions
            </Link>{" "}
            for the matches we cover.
          </p>
        )}
      </section>

      {statsUnavailable && (
        <p role="status" className="mt-6 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
          Some match statistics are temporarily unavailable from our data provider. Predictions above are unaffected.
        </p>
      )}

      {h2hSummary && h2hMatches.length > 0 && (
        <section aria-labelledby="h2h" className="mt-10">
          <h2 id="h2h" className="text-lg font-bold">
            {fixtureName} head to head
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            In their last {h2hSummary.played} meetings, {home.name} won {h2hSummary.teamAWins}, {away.name} won {h2hSummary.teamBWins} and{" "}
            {h2hSummary.draws} ended level, with an average of {average(h2hSummary.totalGoals, h2hSummary.played)} goals per
            game. Both teams scored in {h2hSummary.bothScored} and {h2hSummary.over25} had three or more goals.
          </p>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {h2hMatches.slice(0, 8).map((f) => (
              <li key={f.fixture.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <span>
                  <span className={cn(f.goals.home! > f.goals.away! && "font-semibold")}>{f.teams.home.name}</span>{" "}
                  <span className="tabular-nums">
                    {f.goals.home}–{f.goals.away}
                  </span>{" "}
                  <span className={cn(f.goals.away! > f.goals.home! && "font-semibold")}>{f.teams.away.name}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {f.league.name} · {formatShortDate(f.fixture.date)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(homeForm.length > 0 || awayForm.length > 0) && (
        <section aria-labelledby="form" className="mt-10">
          <h2 id="form" className="text-lg font-bold">
            Recent form
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormCard team={home.name} entries={homeForm} />
            <FormCard team={away.name} entries={awayForm} />
          </div>
        </section>
      )}

      {(homeRow || awayRow) && (
        <section aria-labelledby="standings" className="mt-10">
          <h2 id="standings" className="text-lg font-bold">
            League position{match.league.name ? ` – ${match.league.name}` : ""}
          </h2>
          <StandingsTable rows={[homeRow, awayRow].filter((r): r is StandingRow => Boolean(r))} />
          {competition && (
            <Link href={`/competitions/${competition.slug}`} className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
              Full {competition.name} table and predictions →
            </Link>
          )}
        </section>
      )}

      {(marketPages.length > 0 || relatedFixtures.length > 0) && (
        <section aria-labelledby="related" className="mt-10 grid gap-8 md:grid-cols-2">
          {relatedFixtures.length > 0 && (
            <div>
              <h2 id="related" className="text-lg font-bold">
                More {match.league.name ?? ""} predictions
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {relatedFixtures.map((p) => (
                  <li key={p.id}>
                    <Link href={predictionHref(p)} className="font-medium text-brand hover:underline">
                      {p.home_team} vs {p.away_team} prediction
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">{formatShortDate(p.kickoff_time)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {marketPages.length > 0 && (
            <div>
              <h2 className="text-lg font-bold">Markets for this match</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {marketPages.map((page) => (
                  <li key={page.slug}>
                    <Link href={`/tips/${page.slug}`} className="font-medium text-brand hover:underline">
                      {page.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <ResponsibleNotice className="mt-10" />
    </div>
  );
}

function statusLabel(status: string, fixture: FixtureSummary | null): string {
  if (LIVE_STATUSES.has(status)) return fixture?.fixture.status.elapsed ? `Live · ${fixture.fixture.status.elapsed}'` : "Live";
  if (status === "FT") return "Full time";
  if (status === "AET") return "After extra time";
  if (status === "PEN") return "After penalties";
  if (status === "PST") return "Postponed";
  if (VOID_STATUSES.has(status)) return fixture?.fixture.status.long ?? "Cancelled";
  return "Kickoff (WAT)";
}

function TeamCrest({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex w-28 flex-col items-center gap-2 text-center sm:w-40">
      {logo ? (
        <Image src={logo} alt={`${name} crest`} width={64} height={64} className="size-14 object-contain sm:size-16" priority />
      ) : (
        <span className="flex size-14 items-center justify-center rounded-full bg-secondary sm:size-16">
          <Shield aria-hidden className="size-7 text-muted-foreground/50" />
        </span>
      )}
      <p className="text-sm font-semibold sm:text-base">{name}</p>
    </div>
  );
}

function PredictionSummary({
  match,
  h2h,
  homeForm,
  awayForm,
}: {
  match: MatchCore;
  h2h: ReturnType<typeof summarizeH2H> | null;
  homeForm: FormEntry[];
  awayForm: FormEntry[];
}) {
  const pick = topPick(match.predictions);
  if (!pick) return null;
  const homeSummary = summarizeForm(homeForm);
  const awaySummary = summarizeForm(awayForm);
  const implied = pick.original_odds ? Math.round(100 / Number(pick.original_odds)) : null;

  return (
    <div className="mt-3 space-y-2 text-muted-foreground">
      <p>
        Our highest-rated pick for {match.home.name} vs {match.away.name} is <strong className="text-foreground">{pick.original_prediction_type}</strong>
        {pick.original_odds !== null ? ` at odds of ${Number(pick.original_odds).toFixed(2)}` : ""}
        {implied ? `, an implied probability of about ${implied}%` : ""}.
        {match.predictions.length > 1 ? ` We publish ${match.predictions.length} picks for this match in total, listed below.` : ""}
      </p>
      {(homeSummary.played > 0 || awaySummary.played > 0) && (
        <p>
          {homeSummary.played > 0 &&
            `${match.home.name} have ${homeSummary.wins} wins, ${homeSummary.draws} draws and ${homeSummary.losses} defeats in their last ${homeSummary.played} matches (${homeSummary.goalsFor} scored, ${homeSummary.goalsAgainst} conceded). `}
          {awaySummary.played > 0 &&
            `${match.away.name} have ${awaySummary.wins} wins, ${awaySummary.draws} draws and ${awaySummary.losses} defeats in their last ${awaySummary.played} (${awaySummary.goalsFor} scored, ${awaySummary.goalsAgainst} conceded).`}
        </p>
      )}
      {h2h && h2h.played > 0 && (
        <p>
          The last {h2h.played} head-to-head meetings averaged {average(h2h.totalGoals, h2h.played)} goals, with both teams scoring in {h2h.bothScored}.
        </p>
      )}
      {pick.analysis && <PlainContent text={pick.analysis} />}
    </div>
  );
}

function PredictionsTable({ predictions }: { predictions: PublicPrediction[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-4 py-2">Market</th>
            <th scope="col" className="px-4 py-2">Pick</th>
            <th scope="col" className="px-4 py-2">Odds</th>
            <th scope="col" className="px-4 py-2">Confidence</th>
            <th scope="col" className="px-4 py-2 text-right">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {predictions.map((p) => {
            const market = marketOf(p);
            const page = market ? marketPageForMarket(market) : undefined;
            return (
              <tr key={p.id}>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {page && market ? (
                    <Link href={`/tips/${page.slug}`} className="hover:text-brand">
                      {MARKET_LABELS[market]}
                    </Link>
                  ) : (
                    "Other"
                  )}
                </td>
                <td className="px-4 py-2.5 font-semibold">
                  {p.original_prediction_type}
                  {p.analysis && predictions.length > 1 && <p className="mt-0.5 text-xs font-normal text-muted-foreground">{p.analysis}</p>}
                </td>
                <td className="px-4 py-2.5 tabular-nums">{p.original_odds !== null ? Number(p.original_odds).toFixed(2) : "—"}</td>
                <td className="px-4 py-2.5 tabular-nums">{p.confidence !== null ? `${p.confidence}%` : "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  <ResultBadge result={p.result} verified={p.result_approved} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        Odds and picks are shown as published before kickoff. Confidence for automatic picks is the bookmaker&apos;s implied probability.{" "}
        <Link href="/methodology" className="underline hover:text-brand">
          Methodology
        </Link>
      </p>
    </div>
  );
}

const FORM_STYLES = {
  W: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  D: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  L: "bg-red-500/15 text-red-700 dark:text-red-400",
} as const;

function FormCard({ team, entries }: { team: string; entries: FormEntry[] }) {
  const summary = summarizeForm(entries);
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{team}</h3>
        <span className="flex gap-1" aria-label={`Last ${entries.length} results: ${entries.map((e) => e.result).join(", ")}`}>
          {entries.map((e) => (
            <span key={e.fixtureId} aria-hidden className={cn("flex size-6 items-center justify-center rounded text-[11px] font-bold", FORM_STYLES[e.result])}>
              {e.result}
            </span>
          ))}
        </span>
      </div>
      {entries.length > 0 ? (
        <>
          <ul className="mt-3 space-y-1.5 text-sm">
            {entries.map((e) => (
              <li key={e.fixtureId} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">
                  {e.venue === "H" ? "vs" : "at"} {e.opponent}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {e.goalsFor}–{e.goalsAgainst} · {formatShortDate(e.date)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            {summary.goalsFor} scored, {summary.goalsAgainst} conceded · both teams scored in {summary.bothScored} of {summary.played} · {summary.cleanSheets}{" "}
            clean {summary.cleanSheets === 1 ? "sheet" : "sheets"}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No recent results available.</p>
      )}
    </div>
  );
}

function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-4 py-2">#</th>
            <th scope="col" className="py-2">Team</th>
            <th scope="col" className="py-2 text-center">P</th>
            <th scope="col" className="py-2 text-center">W</th>
            <th scope="col" className="py-2 text-center">D</th>
            <th scope="col" className="py-2 text-center">L</th>
            <th scope="col" className="py-2 text-center">GF:GA</th>
            <th scope="col" className="py-2 text-center">Home W-D-L</th>
            <th scope="col" className="py-2 text-center">Away W-D-L</th>
            <th scope="col" className="px-4 py-2 text-center">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.team.id}>
              <td className="px-4 py-2 font-medium">{r.rank}</td>
              <td className="py-2 font-medium">{r.team.name}</td>
              <td className="py-2 text-center">{r.all.played}</td>
              <td className="py-2 text-center">{r.all.win}</td>
              <td className="py-2 text-center">{r.all.draw}</td>
              <td className="py-2 text-center">{r.all.lose}</td>
              <td className="py-2 text-center tabular-nums">
                {r.all.goals.for}:{r.all.goals.against}
              </td>
              <td className="py-2 text-center tabular-nums">{r.home ? `${r.home.win}-${r.home.draw}-${r.home.lose}` : "—"}</td>
              <td className="py-2 text-center tabular-nums">{r.away ? `${r.away.win}-${r.away.draw}-${r.away.lose}` : "—"}</td>
              <td className="px-4 py-2 text-center font-bold">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
