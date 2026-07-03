import { getPlanBySlug } from "@/lib/data/plans";
import { getPredictionsForPlan } from "@/lib/data/predictions";
import { getDateRange, type DateNavPeriod } from "@/lib/utils/date";
import { DateNav } from "@/components/predictions/date-nav";
import { PredictionList } from "@/components/predictions/prediction-list";
import { LockOverlay } from "@/components/predictions/lock-overlay";
import { PLAN_SLUGS } from "@/lib/constants";

export async function CorrectScorePreviewSection({ period, date }: { period: DateNavPeriod; date?: string }) {
  const plan = await getPlanBySlug(PLAN_SLUGS.CORRECT_SCORES);
  if (!plan) return null;

  const effectivePeriod = date ? "custom" : period;
  const range = getDateRange(effectivePeriod, date ? new Date(date) : undefined);
  const predictions = await getPredictionsForPlan(plan.id, range, { unlocked: false });

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Correct Score Predictions</h2>
          <p className="text-sm text-muted-foreground">{range.label}</p>
        </div>
        <DateNav
          active={effectivePeriod}
          basePath="/"
          extraParams={{ section: "correct-score" }}
          currentDate={range.date}
        />
      </div>
      <div className="relative mt-6 min-h-[22rem] overflow-hidden rounded-2xl border border-brand/20 bg-card p-4 shadow-sm">
        <div className="pointer-events-none">
          <PredictionList predictions={predictions} emptyLabel="No correct score picks published for this date yet." />
        </div>
        <LockOverlay
          title="Premium Content Locked"
          message="Subscribe to Correct Scores to see today's exact scoreline predictions."
          ctaHref={`/pricing?plan=${plan.slug}`}
        />
      </div>
    </section>
  );
}
