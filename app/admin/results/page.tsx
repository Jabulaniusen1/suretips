import Link from "next/link";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { getResultsQueue } from "@/lib/data/admin-predictions";
import { PredictionsTable } from "@/components/admin/predictions-table";
import { RunSyncButton } from "@/components/admin/run-sync-button";

export const metadata: Metadata = { title: "Results" };

export default async function AdminResultsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: rawView } = await searchParams;
  const view = rawView === "ungraded" ? "ungraded" : "awaiting";
  const rows = await getResultsQueue(view);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Results</h1>
        <RunSyncButton job="scores" />
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Results are graded automatically from the 90-minute score, but they only count on the public results page and in win
        rates after you approve them. Check the score against an official source, correct it if needed (edit the prediction,
        then “Re-grade from score”), and approve. Changing an approved result automatically revokes its approval.
      </p>

      <div className="mt-4 flex gap-2 text-sm">
        {[
          { key: "awaiting", label: "Awaiting approval" },
          { key: "ungraded", label: "Needs manual grading" },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "awaiting" ? "/admin/results" : "/admin/results?view=ungraded"}
            className={cn("rounded-full border px-3 py-1.5", view === tab.key ? "border-brand bg-brand text-brand-foreground" : "border-border")}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {view === "ungraded" && (
        <p className="mt-3 text-sm text-muted-foreground">
          Picks still pending four hours after kickoff — usually a bespoke market the grader can&apos;t read, a missing score, or a
          fixture without an API id. Set the result from the dropdown.
        </p>
      )}

      <div className="mt-4">
        <PredictionsTable predictions={rows} mode="results" />
      </div>
    </div>
  );
}
