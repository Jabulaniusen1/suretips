import Link from "next/link";
import type { Metadata } from "next";
import { getHomepageWinnings } from "@/lib/data/winnings";
import { WinningsTable } from "@/components/winnings/winnings-table";
import { formatShortDate } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Previous Winnings" };

export default async function DashboardWinningsPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string }>;
}) {
  const { before } = await searchParams;
  const { groups, oldestDate } = await getHomepageWinnings(before);

  return (
    <div>
      <h1 className="text-xl font-bold">Previous Winnings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Full results history across all VIP packages.</p>

      <div className="mt-4 space-y-6">
        {groups.map((group) => (
          <div key={group.plan.id} className="rounded-2xl border border-border bg-card p-4">
            <h3 className="px-2 text-sm font-bold uppercase tracking-wide text-brand">{group.plan.name}</h3>
            <WinningsTable entries={group.entries} />
          </div>
        ))}
        {groups.length === 0 && <p className="text-sm text-muted-foreground">No results published yet.</p>}
      </div>

      {oldestDate && (
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" render={<Link href={`/dashboard/winnings?before=${oldestDate}`} />}>
            Previous results before {formatShortDate(oldestDate)}
          </Button>
        </div>
      )}
    </div>
  );
}
