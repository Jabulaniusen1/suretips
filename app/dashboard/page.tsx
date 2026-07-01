import type { Metadata } from "next";
import { Crown, Target, Send } from "lucide-react";
import { DashboardTile } from "@/components/dashboard/dashboard-tile";
import { getSiteConfig } from "@/lib/data/site-config";
import { PLAN_SLUGS } from "@/lib/constants";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const config = await getSiteConfig();

  return (
    <div>
      <h1 className="text-xl font-bold">VIP Zone</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a package below to view today&apos;s predictions.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DashboardTile
          href={`/dashboard/vip/${PLAN_SLUGS.DAILY_2_ODDS}`}
          title="Daily 2 Odds Combo"
          description="VIP · Premium Picks"
          icon={Crown}
          iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
        />
        <DashboardTile
          href={`/dashboard/vip/${PLAN_SLUGS.DAILY_5_ODDS}`}
          title="Daily 5 Odds Combo"
          description="VIP · Premium Picks"
          icon={Crown}
          iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
        />
        <DashboardTile
          href={`/dashboard/vip/${PLAN_SLUGS.DAILY_50_ODDS}`}
          title="Daily 50 Odds Combo"
          description="VIP · Premium Picks"
          icon={Crown}
          iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
        />
        <DashboardTile
          href={`/dashboard/vip/${PLAN_SLUGS.CORRECT_SCORES}`}
          title="Correct Scores"
          description="VIP · Premium Insight"
          icon={Target}
          iconClassName="bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
        />
        <DashboardTile
          href={config.telegram_url}
          title="Telegram"
          description="Join our Telegram channel"
          icon={Send}
          iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
          external
        />
      </div>
    </div>
  );
}
