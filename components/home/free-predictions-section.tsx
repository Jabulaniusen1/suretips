import { getFreePredictions } from "@/lib/data/predictions";
import { getDateRange, type DateNavPeriod } from "@/lib/utils/date";
import { applyPredictionFilter, FREE_PREDICTIONS_FILTERS } from "@/lib/utils/prediction-filter";
import { FilterTabs } from "@/components/predictions/filter-tabs";
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
  const filterLabel = FREE_PREDICTIONS_FILTERS.find((f) => f.id === filter)?.label ?? "Free Tips, Daily";

  return (
    <section id="free-predictions" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Free Tips, Daily</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No paywall, no catch — hand-picked predictions our whole community can use.
        </p>
      </div>
      <div className="mt-6">
        <FilterTabs active={filter} />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">{filterLabel}</h3>
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
