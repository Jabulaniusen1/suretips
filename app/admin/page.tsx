import Link from "next/link";
import type { Metadata } from "next";
import { getAdminKpis } from "@/lib/data/admin-kpis";
import { getResultWindows } from "@/lib/data/results";
import { formatWinRate } from "@/lib/predictions/stats";
import { RunSyncButton } from "@/components/admin/run-sync-button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [kpis, windows] = await Promise.all([getAdminKpis(), getResultWindows()]);

  const cards: Array<{ label: string; value: string | number; href: string; alert?: boolean }> = [
    // The admin Predictions and Results pages are hidden, so these open the public pages.
    { label: "Predictions today", value: kpis.predictionsToday, href: "/" },
    { label: "Predictions tomorrow", value: kpis.predictionsTomorrow, href: "/predictions" },
    // Results are graded and approved automatically (lib/predictions/update-scores.ts).
    // { label: "Results awaiting approval", value: kpis.awaitingVerification, href: "/admin/results", alert: kpis.awaitingVerification > 0 },
    // { label: "Need manual grading", value: kpis.needsGrading, href: "/admin/results?view=ungraded", alert: kpis.needsGrading > 0 },
    { label: "Verified win rate (30d)", value: formatWinRate(windows.last30?.winRate ?? null), href: "/previous-results" },
    { label: "Settled results (30d)", value: windows.last30?.settled ?? "—", href: "/previous-results" },
    { label: "Published articles", value: kpis.publishedPosts, href: "/admin/blog" },
    // User accounts are turned off.
    // { label: "New accounts (7d)", value: kpis.newUsers7d, href: "/admin/users" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold">Dashboard</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-2xl border bg-card p-4 transition-colors hover:border-brand ${card.alert ? "border-brand/60" : "border-border"}`}
          >
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Predictions and Results admin pages are hidden from the sidebar.
        <Link href="/admin/predictions/add" className="rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-brand">
          + Add prediction
        </Link>
        <Link href="/admin/results" className="rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-brand">
          Review results
        </Link>
        */}
        <Link href="/admin/blog/write" className="rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-brand">
          + Write article
        </Link>
        <Link href="/admin/pages" className="rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-brand">
          + SEO landing page
        </Link>
      </div>

      <section className="mt-8 max-w-2xl rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold">Automatic sync</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Runs automatically every 4 hours (Vercel Cron). Fills each market up to 10 picks for today, tomorrow and the day after
          using bookmaker odds; never edits or deletes existing predictions. Scores update every 15 minutes, and finished matches
          are graded and approved automatically.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <RunSyncButton job="sync" />
          <RunSyncButton job="scores" />
        </div>
      </section>
    </div>
  );
}
