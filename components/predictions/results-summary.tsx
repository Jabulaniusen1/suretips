import { cn } from "@/lib/utils";
import { formatWinRate, type ResultSummary } from "@/lib/predictions/stats";

/** Stat tiles for a results window. Renders real numbers only. */
export function ResultsSummary({
  summary,
  title,
  compact = false,
}: {
  summary: ResultSummary | null;
  title?: string;
  compact?: boolean;
}) {
  if (!summary) {
    return <p className="text-sm text-muted-foreground">Results statistics are temporarily unavailable.</p>;
  }

  const tiles = [
    { label: "Win rate", value: formatWinRate(summary.winRate), emphasis: true },
    { label: "Wins", value: summary.wins },
    { label: "Losses", value: summary.losses },
    { label: "Void", value: summary.pushes },
    { label: "Pending", value: summary.pending },
    { label: "Total", value: summary.total },
  ];

  return (
    <div>
      {title && <h3 className="mb-2 text-sm font-semibold">{title}</h3>}
      <dl className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-6")}>
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-card px-3 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{tile.label}</dt>
            <dd className={cn("mt-0.5 text-lg font-bold tabular-nums", tile.emphasis && "text-brand")}>{tile.value}</dd>
          </div>
        ))}
      </dl>
      {summary.awaitingVerification > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Pending includes {summary.awaitingVerification} graded {summary.awaitingVerification === 1 ? "result" : "results"} awaiting verification.
        </p>
      )}
    </div>
  );
}
