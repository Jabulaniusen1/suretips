import Link from "next/link";
import type { Metadata } from "next";
import { getPredictionsForDays } from "@/lib/data/predictions";
import { addDaysToKey, formatDateKeyLong, lagosDateKey, lagosDayRange } from "@/lib/utils/date";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { MarketNav } from "@/components/predictions/market-nav";
import { PredictionList } from "@/components/predictions/prediction-list";
import { ResponsibleNotice } from "@/components/site/responsible-notice";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Football Predictions Tomorrow – Upcoming Free Tips",
  description:
    "Free football predictions for tomorrow and the day after: upcoming tips across every market with odds, confidence and links to full match previews.",
  path: "/predictions",
});

export default async function UpcomingPredictionsPage() {
  const tomorrow = addDaysToKey(lagosDateKey(), 1);
  const days = [tomorrow, addDaysToKey(tomorrow, 1)];
  const predictions = await getPredictionsForDays(tomorrow, days.length);

  const byDay = days.map((dateKey) => {
    const { from, to } = lagosDayRange(dateKey);
    return { dateKey, items: predictions.filter((p) => p.kickoff_time >= from && p.kickoff_time <= to) };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: "Upcoming predictions", path: "/predictions" }]} />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Football Predictions Tomorrow</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Free predictions for the next two days of football, published ahead of kickoff so you have time to check team news.
        Open any match for its head-to-head record, recent form and league position. Looking for today&apos;s games? See{" "}
        <Link href="/" className="font-medium text-brand hover:underline">
          football predictions today
        </Link>
        .
      </p>

      <div className="mt-6">
        <MarketNav active="" />
      </div>

      {byDay.map(({ dateKey, items }, index) => (
        <section key={dateKey} aria-labelledby={`day-${dateKey}`} className="mt-8">
          <h2 id={`day-${dateKey}`} className="text-lg font-bold">
            {index === 0 ? "Tomorrow" : "Day after tomorrow"} · {formatDateKeyLong(dateKey)}
          </h2>
          <div className="mt-3">
            <PredictionList
              predictions={items}
              emptyState={
                <>
                  Predictions for {formatDateKeyLong(dateKey)} haven&apos;t been published yet. Picks are added automatically
                  through the day before kickoff — check back later.
                </>
              }
            />
          </div>
        </section>
      ))}

      <ResponsibleNotice className="mt-10" />
    </div>
  );
}
