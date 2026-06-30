import {
  getAdjacentWinningsDates,
  getLatestWinningsDate,
  getWinningsForDate,
  getWinningsStats,
} from "@/lib/data/winnings";
import { WinningsTable } from "@/components/winnings/winnings-table";
import { WinningsDateNav } from "@/components/winnings/winnings-date-nav";
import { WinningsStats } from "@/components/winnings/winnings-stats";

export async function PlanResultsPanel({
  planId,
  basePath,
  resultsDate,
}: {
  planId: string;
  basePath: string;
  resultsDate?: string;
}) {
  const date = resultsDate ?? (await getLatestWinningsDate(planId));

  if (!date) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-bold uppercase tracking-wide text-brand">Previous Results</h3>
        <p className="mt-4 py-8 text-center text-sm text-muted-foreground">
          No results published for this package yet — check back soon.
        </p>
      </div>
    );
  }

  const [entries, { previousDate, nextDate }, stats] = await Promise.all([
    getWinningsForDate(planId, date),
    getAdjacentWinningsDates(planId, date),
    getWinningsStats(planId),
  ]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-bold uppercase tracking-wide text-brand">Previous Results</h3>
      <p className="text-sm text-muted-foreground">Check our past performance and success rate.</p>
      <div className="mt-4">
        <WinningsDateNav basePath={basePath} date={date} previousDate={previousDate} nextDate={nextDate} />
      </div>
      <div className="mt-4">
        <WinningsTable entries={entries} />
      </div>
      <div className="mt-4">
        <WinningsStats {...stats} />
      </div>
    </div>
  );
}
