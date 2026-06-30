import Link from "next/link";
import type { Metadata } from "next";
import { getHomepageWinnings } from "@/lib/data/winnings";
import { WinningsTable } from "@/components/winnings/winnings-table";
import { formatShortDate } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Previous Results" };

export default async function PreviousResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string }>;
}) {
  const { before } = await searchParams;
  const { groups, oldestDate } = await getHomepageWinnings(before);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Previous Results</h1>
      <p className="mt-2 text-muted-foreground">
        Every prediction we&apos;ve published, win or loss. This is our full track record — see for yourself before
        you subscribe.
      </p>

      <div className="mt-8 space-y-6">
        {groups.map((group) => (
          <div key={group.plan.id} className="rounded-2xl border border-border bg-card p-4">
            <h3 className="px-2 text-sm font-bold uppercase tracking-wide text-brand">{group.plan.name}</h3>
            <WinningsTable entries={group.entries} />
          </div>
        ))}
        {groups.length === 0 && <p className="text-sm text-muted-foreground">No results published yet.</p>}
      </div>

      {oldestDate && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" render={<Link href={`/previous-results?before=${oldestDate}`} />}>
            Previous results before {formatShortDate(oldestDate)}
          </Button>
        </div>
      )}
    </div>
  );
}
