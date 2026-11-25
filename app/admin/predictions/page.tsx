import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { PredictionsTable } from "@/components/admin/predictions-table";
import { ADMIN_PAGE_SIZE, getAdminPredictions, type AdminPredictionFilters } from "@/lib/data/admin-predictions";
import { MARKET_KEYS, MARKET_LABELS } from "@/lib/predictions/markets";

export const metadata: Metadata = { title: "Predictions" };

const selectClass = "rounded-md border border-input bg-background px-2 py-1.5 text-sm";

export default async function AdminPredictionsPage({ searchParams }: { searchParams: Promise<AdminPredictionFilters> }) {
  const filters = await searchParams;
  const { rows, total, page } = await getAdminPredictions(filters);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const pageHref = (p: number) => {
    const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]);
    q.set("page", String(p));
    return `/admin/predictions?${q.toString()}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Predictions</h1>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/predictions/add-with-api" />}>
            Sync from API
          </Button>
          <Button render={<Link href="/admin/predictions/add" />}>+ Add prediction</Button>
        </div>
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3 text-sm">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Day
          <select name="range" defaultValue={filters.range ?? ""} className={selectClass}>
            <option value="">All dates</option>
            <option value="yesterday">Yesterday</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Or date
          <input type="date" name="date" defaultValue={filters.date ?? ""} className={selectClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Status
          <select name="status" defaultValue={filters.status ?? ""} className={selectClass}>
            <option value="">Any</option>
            <option value="not_started">Not started</option>
            <option value="live">Live</option>
            <option value="finished">Finished</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Result
          <select name="result" defaultValue={filters.result ?? ""} className={selectClass}>
            <option value="">Any</option>
            <option value="pending">Pending</option>
            <option value="unapproved">Awaiting approval</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="push">Void</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Market
          <select name="market" defaultValue={filters.market ?? ""} className={selectClass}>
            <option value="">Any</option>
            {MARKET_KEYS.map((m) => (
              <option key={m} value={m}>
                {MARKET_LABELS[m]}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Source
          <select name="source" defaultValue={filters.source ?? ""} className={selectClass}>
            <option value="">Any</option>
            <option value="api_sync">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Search
          <input name="q" defaultValue={filters.q ?? ""} placeholder="Team or league" className={selectClass} />
        </label>
        <Button type="submit" size="sm">
          Filter
        </Button>
        <Button variant="ghost" size="sm" render={<Link href="/admin/predictions" />}>
          Reset
        </Button>
      </form>

      <p className="mt-3 text-sm text-muted-foreground">
        {total} predictions · page {page} of {totalPages}
      </p>
      <div className="mt-2">
        <PredictionsTable predictions={rows} />
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between text-sm">
          {page > 1 ? <Link href={pageHref(page - 1)} className="text-brand">← Previous</Link> : <span />}
          {page < totalPages ? <Link href={pageHref(page + 1)} className="text-brand">Next →</Link> : <span />}
        </div>
      )}
    </div>
  );
}
