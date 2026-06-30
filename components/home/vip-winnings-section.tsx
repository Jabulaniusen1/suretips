import Link from "next/link";
import { getHomepageWinnings } from "@/lib/data/winnings";
import { WinningsTable } from "@/components/winnings/winnings-table";
import { formatShortDate } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";

export async function VipWinningsSection({ beforeDate }: { beforeDate?: string }) {
  const { groups, oldestDate } = await getHomepageWinnings(beforeDate);

  return (
    <section id="vip-winnings" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">VIP Previous Winnings</h2>
          <p className="text-sm text-muted-foreground">
            Real results from every VIP package — see the proof before you subscribe.
          </p>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/previous-results" />}>
          View Full History
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Results will appear here once the admin publishes the first VIP winnings entry.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((group) => (
            <div key={group.plan.id} className="rounded-2xl border border-border bg-card p-4">
              <h3 className="px-2 text-sm font-bold uppercase tracking-wide text-brand">{group.plan.name}</h3>
              <WinningsTable entries={group.entries} />
            </div>
          ))}
        </div>
      )}

      {oldestDate && (
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" render={<Link href={`/?winningsBefore=${oldestDate}#vip-winnings`} />}>
            Previous results before {formatShortDate(oldestDate)}
          </Button>
        </div>
      )}
    </section>
  );
}
