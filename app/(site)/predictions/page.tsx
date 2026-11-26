import type { Metadata } from "next";
import { InlineContent, PlainContent } from "@/components/content/plain-content";
import { getSiteText } from "@/lib/content/site-text";
import { getPredictionsForDays } from "@/lib/data/predictions";
import { addDaysToKey, formatDateKeyLong, lagosDateKey, lagosDayRange } from "@/lib/utils/date";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { MarketNav } from "@/components/predictions/market-nav";
import { PredictionList } from "@/components/predictions/prediction-list";
import { ResponsibleNotice } from "@/components/site/responsible-notice";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const text = await getSiteText();
  return pageMetadata({ title: text.t("tomorrow.seoTitle"), description: text.t("tomorrow.seoDescription"), path: "/predictions" });
}

export default async function UpcomingPredictionsPage() {
  const tomorrow = addDaysToKey(lagosDateKey(), 1);
  const days = [tomorrow, addDaysToKey(tomorrow, 1)];
  const [predictions, text] = await Promise.all([getPredictionsForDays(tomorrow, days.length), getSiteText()]);
  const intro = text.t("tomorrow.intro");

  const byDay = days.map((dateKey) => {
    const { from, to } = lagosDayRange(dateKey);
    return { dateKey, items: predictions.filter((p) => p.kickoff_time >= from && p.kickoff_time <= to) };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: text.t("tomorrow.breadcrumb"), path: "/predictions" }]} />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
        <InlineContent text={text.t("tomorrow.h1")} />
      </h1>
      {intro && <PlainContent text={intro} className="mt-3 max-w-3xl text-muted-foreground" />}

      <div className="mt-6">
        <MarketNav active="" />
      </div>

      {byDay.map(({ dateKey, items }, index) => (
        <section key={dateKey} aria-labelledby={`day-${dateKey}`} className="mt-8">
          <h2 id={`day-${dateKey}`} className="text-lg font-bold">
            <InlineContent text={text.t(index === 0 ? "tomorrow.day1" : "tomorrow.day2", { date: formatDateKeyLong(dateKey) })} />
          </h2>
          <div className="mt-3">
            <PredictionList
              predictions={items}
              emptyState={<InlineContent text={text.t("tomorrow.empty", { date: formatDateKeyLong(dateKey) })} />}
            />
          </div>
        </section>
      ))}

      <ResponsibleNotice className="mt-10" />
    </div>
  );
}
