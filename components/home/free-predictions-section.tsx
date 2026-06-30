import { getFreePredictions } from "@/lib/data/predictions";
import { getDateRange, type DateNavPeriod } from "@/lib/utils/date";
import { applyPredictionFilter, FREE_PREDICTIONS_FILTERS } from "@/lib/utils/prediction-filter";
import { FreePredictionsFilterBar } from "@/components/home/free-predictions-filter-bar";
import { DateNav } from "@/components/predictions/date-nav";
import { PredictionList } from "@/components/predictions/prediction-list";

export async function FreePredictionsSection({
  period,
  filter,
  date,
}: {
  period: DateNavPeriod;
  filter: string;
  date?: string;
}) {
  const effectivePeriod = date ? "custom" : period;
  const range = getDateRange(effectivePeriod, date ? new Date(date) : undefined);
  const allPredictions = await getFreePredictions(range);
  const predictions = applyPredictionFilter(allPredictions, filter);
  const filterLabel = FREE_PREDICTIONS_FILTERS.find((f) => f.id === filter)?.label ?? "Free Safe Picks";

  return (
    <section id="free-predictions" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <FreePredictionsFilterBar active={filter} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{filterLabel}</h2>
          <p className="text-sm text-muted-foreground">{range.label}</p>
        </div>
        <DateNav active={effectivePeriod} basePath="/" extraParams={{ filter }} currentDate={range.date} />
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <PredictionList predictions={predictions} emptyLabel="No free predictions for this date yet — check back soon." />
      </div>
    </section>
  );
}
