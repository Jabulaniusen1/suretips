import type { Metadata } from "next";
import { Bell, Headset, ListChecks, Settings, Trophy } from "lucide-react";
import { DashboardTile } from "@/components/dashboard/dashboard-tile";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">Your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">All predictions are free — no account is needed to read them.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DashboardTile href="/" title="Today's predictions" description="Free tips across every market" icon={ListChecks} iconClassName="bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400" />
        <DashboardTile href="/previous-results" title="Previous results" description="Our verified record" icon={Trophy} iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <DashboardTile href="/dashboard/chat" title="Contact support" description="Message our team" icon={Headset} iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" />
        <DashboardTile href="/dashboard/notifications" title="Notifications" description="Updates for your account" icon={Bell} iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" />
        <DashboardTile href="/dashboard/settings" title="Settings" description="Profile and password" icon={Settings} iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
      </div>
    </div>
  );
}
