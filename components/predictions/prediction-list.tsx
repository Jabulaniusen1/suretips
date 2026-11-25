import Link from "next/link";
import Image from "next/image";
import { CalendarX2, Check, Clock, Minus, Shield, Trophy, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDayMonth, formatKickoffTime } from "@/lib/utils/date";
import type { PublicPrediction } from "@/lib/data/predictions";

type Prediction = PublicPrediction;

// One column template shared by the header and every row so they always line
// up. Container queries (not viewport breakpoints) pick the layout, so the
// list stays compact inside narrow containers.
//   compact: time | match | tip (+ odds/confidence/result stacked)
//   @2xl:    time | match | tip | odds | confidence | result
const ROW_GRID =
  "grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-x-3 @2xl:grid-cols-[4rem_minmax(0,1fr)_10rem_3.5rem_5.5rem_6rem] @2xl:gap-x-4";

const RESULT_STYLES: Record<Prediction["result"], { label: string; icon: LucideIcon; className: string }> = {
  win: { label: "Won", icon: Check, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  loss: { label: "Lost", icon: X, className: "bg-red-500/15 text-red-700 dark:text-red-400" },
  push: { label: "Void", icon: Minus, className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  pending: { label: "Pending", icon: Clock, className: "bg-secondary text-muted-foreground" },
};

/** Canonical public URL for a prediction: its match page when it has a fixture. */
export function predictionHref(p: Pick<Prediction, "id" | "external_fixture_id">): string {
  return p.external_fixture_id ? `/match/${p.external_fixture_id}` : `/predictions/${p.id}`;
}

type LeagueGroup = { key: string; name: string; leagueId: number | null; items: Prediction[] };

// Groups keep the order in which each league first appears. Keyed by API
// league id when present so two leagues sharing a name don't merge.
function groupByLeague(predictions: Prediction[]): LeagueGroup[] {
  const groups = new Map<string, LeagueGroup>();
  for (const prediction of predictions) {
    const key = prediction.league_id ? `id:${prediction.league_id}` : `name:${prediction.league ?? ""}`;
    const group = groups.get(key);
    if (group) group.items.push(prediction);
    else groups.set(key, { key, name: prediction.league ?? "Other matches", leagueId: prediction.league_id, items: [prediction] });
  }
  return [...groups.values()];
}

function TeamBadge({ logo }: { logo: string | null }) {
  if (logo) return <Image src={logo} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" />;
  return <Shield aria-hidden className="size-5 shrink-0 text-muted-foreground/40" />;
}

function LeagueBadge({ leagueId }: { leagueId: number | null }) {
  if (leagueId) {
    return (
      <Image
        src={`https://media.api-sports.io/football/leagues/${leagueId}.png`}
        alt=""
        width={16}
        height={16}
        className="size-4 shrink-0 object-contain"
      />
    );
  }
  return <Trophy aria-hidden className="size-4 shrink-0 text-muted-foreground" />;
}

function TeamLine({ name, logo, score, live, dimmed }: { name: string; logo: string | null; score: number | null; live: boolean; dimmed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <TeamBadge logo={logo} />
      <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", dimmed && "text-muted-foreground")}>{name}</span>
      {score !== null && <span className={cn("w-5 text-right text-sm font-bold tabular-nums", live && "text-brand")}>{score}</span>}
    </div>
  );
}

function KickoffCell({ prediction, showDate }: { prediction: Prediction; showDate: boolean }) {
  return (
    <div className="flex flex-col">
      <time dateTime={prediction.kickoff_time} className="text-sm font-semibold tabular-nums">
        {formatKickoffTime(prediction.kickoff_time)}
      </time>
      {prediction.status === "live" ? (
        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase text-brand">
          <span aria-hidden className="size-1.5 rounded-full bg-brand" />
          Live
        </span>
      ) : prediction.status === "finished" ? (
        <span className="mt-0.5 text-[11px] font-semibold uppercase text-muted-foreground">FT</span>
      ) : showDate ? (
        <span className="mt-0.5 text-[11px] text-muted-foreground">{formatDayMonth(prediction.kickoff_time)}</span>
      ) : null}
    </div>
  );
}

function TipPill({ tip, className }: { tip: string; className?: string }) {
  return (
    <span title={tip} className={cn("inline-block max-w-full truncate rounded-md bg-brand/10 px-2 py-1 text-xs font-semibold text-brand", className)}>
      {tip}
    </span>
  );
}

/** Colour band for a confidence value: low (<50) red, medium (50-69) amber, high (70+) green. */
function confidenceTone(value: number): { bar: string; text: string } {
  if (value >= 70) return { bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" };
  if (value >= 50) return { bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" };
  return { bar: "bg-red-500", text: "text-red-700 dark:text-red-400" };
}

function ConfidenceMeter({ value }: { value: number | null }) {
  if (value === null) return <span className="text-sm text-muted-foreground">—</span>;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold tabular-nums">{pct}%</span>
      <div aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", confidenceTone(pct).bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ResultBadge({ result, verified }: { result: Prediction["result"]; verified: boolean }) {
  const { label, icon: Icon, className } = RESULT_STYLES[result];
  const unverified = result !== "pending" && !verified;
  return (
    <span
      title={unverified ? `${label} — awaiting verification` : undefined}
      className={cn(
        // relative: keeps the absolutely positioned sr-only label inside table scrollers on phones.
        "relative inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        className,
        unverified && "border border-dashed border-current bg-transparent"
      )}
    >
      <Icon aria-hidden className="size-3" />
      {label}
      {unverified && <span className="sr-only"> (awaiting verification)</span>}
    </span>
  );
}

function PredictionRow({ prediction, showDate }: { prediction: Prediction; showDate: boolean }) {
  const isLive = prediction.status === "live";
  const isFinished = prediction.status === "finished";
  const hasScore = prediction.status !== "not_started" && prediction.home_score !== null && prediction.away_score !== null;
  const homeScore = hasScore ? prediction.home_score : null;
  const awayScore = hasScore ? prediction.away_score : null;
  const odds = prediction.odds === null ? null : Number(prediction.odds).toFixed(2);

  return (
    <Link
      href={predictionHref(prediction)}
      aria-label={`${prediction.home_team} vs ${prediction.away_team}: ${prediction.prediction_type}`}
      className={cn(ROW_GRID, "relative px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none", isLive && "bg-brand/[0.03]")}
    >
      {isLive && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-brand" />}

      <KickoffCell prediction={prediction} showDate={showDate} />

      <div className="min-w-0 space-y-1.5">
        <TeamLine
          name={prediction.home_team}
          logo={prediction.home_team_logo}
          score={homeScore}
          live={isLive}
          dimmed={isFinished && homeScore !== null && awayScore !== null && homeScore < awayScore}
        />
        <TeamLine
          name={prediction.away_team}
          logo={prediction.away_team_logo}
          score={awayScore}
          live={isLive}
          dimmed={isFinished && homeScore !== null && awayScore !== null && awayScore < homeScore}
        />
      </div>

      {/* Compact layout: tip on top, odds · confidence · result underneath */}
      <div className="flex flex-col items-end gap-1.5 @2xl:hidden">
        <TipPill tip={prediction.prediction_type} className="max-w-[8.5rem]" />
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
          {odds && <span>@ {odds}</span>}
          {prediction.confidence !== null && (
            <span className={cn("font-medium", confidenceTone(prediction.confidence).text)}>{prediction.confidence}%</span>
          )}
          {prediction.result !== "pending" && <ResultBadge result={prediction.result} verified={prediction.result_approved} />}
        </div>
      </div>

      {/* Full table layout */}
      <div className="hidden min-w-0 @2xl:block">
        <TipPill tip={prediction.prediction_type} />
      </div>
      <div className="hidden text-sm font-semibold tabular-nums @2xl:block">
        {odds ?? <span className="font-normal text-muted-foreground">—</span>}
      </div>
      <div className="hidden @2xl:block">
        <ConfidenceMeter value={prediction.confidence} />
      </div>
      <div className="hidden justify-self-end @2xl:block">
        <ResultBadge result={prediction.result} verified={prediction.result_approved} />
      </div>
    </Link>
  );
}

export function PredictionList({
  predictions,
  emptyState,
  showDate = false,
  groupByCompetition = true,
}: {
  predictions: Prediction[];
  emptyState?: React.ReactNode;
  /** Show the kickoff date under the time (multi-day lists). */
  showDate?: boolean;
  /** Ranked lists (e.g. safe picks) keep their order instead of grouping. */
  groupByCompetition?: boolean;
}) {
  if (predictions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted">
          <CalendarX2 aria-hidden className="size-5 text-muted-foreground" />
        </span>
        <div className="max-w-md text-sm text-muted-foreground">{emptyState ?? "No predictions published for this date yet."}</div>
      </div>
    );
  }

  const groups: LeagueGroup[] = groupByCompetition
    ? groupByLeague(predictions)
    : [{ key: "ranked", name: "", leagueId: null, items: predictions }];
  const leagueCount = new Set(predictions.map((p) => p.league_id ?? p.league)).size;
  const hasUnverified = predictions.some((p) => p.result !== "pending" && !p.result_approved);

  return (
    <div className="@container overflow-hidden rounded-2xl border border-border bg-card">
      <div
        aria-hidden
        className={cn(ROW_GRID, "border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground")}
      >
        <span>Time</span>
        <span>Match</span>
        <span className="text-right @2xl:text-left">Tip</span>
        <span className="hidden @2xl:block">Odds</span>
        <span className="hidden @2xl:block">Confidence</span>
        <span className="hidden text-right @2xl:block">Result</span>
      </div>

      {groups.map((group) => (
        <section key={group.key} aria-label={group.name || undefined} className="border-b border-border last:border-b-0">
          {groupByCompetition && (
            <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2">
              <LeagueBadge leagueId={group.leagueId} />
              <h3 className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide">{group.name}</h3>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {group.items.length} {group.items.length === 1 ? "tip" : "tips"}
              </span>
            </div>
          )}
          <div className="divide-y divide-border">
            {group.items.map((prediction) => (
              <PredictionRow key={prediction.id} prediction={prediction} showDate={showDate} />
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
        <span>
          {predictions.length} {predictions.length === 1 ? "prediction" : "predictions"} · {leagueCount} {leagueCount === 1 ? "competition" : "competitions"} · Times in WAT
        </span>
        {hasUnverified && <span>Dashed result = awaiting verification</span>}
      </div>
    </div>
  );
}
