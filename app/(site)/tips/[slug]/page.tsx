import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCustomPageBySlug } from "@/lib/data/custom-pages";
import { getFreePredictions } from "@/lib/data/predictions";
import { getDateRange, type DateNavPeriod } from "@/lib/utils/date";
import { applyPredictionFilter, FILTER_IDS, FILTER_PAGE_META, type FilterId } from "@/lib/utils/prediction-filter";
import { TipsHero } from "@/components/predictions/tips-hero";
import { DateNav } from "@/components/predictions/date-nav";
import { PredictionList } from "@/components/predictions/prediction-list";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  if (FILTER_IDS.has(slug)) {
    const meta = FILTER_PAGE_META[slug as FilterId];
    return { title: meta.title, description: meta.subtitle };
  }

  const page = await getCustomPageBySlug(slug);
  if (!page) return {};
  return { title: page.meta_title ?? page.title, description: page.meta_description ?? undefined };
}

export default async function TipsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const { slug } = await params;
  const { period: periodParam, date } = await searchParams;

  const period = date ? "custom" : ((periodParam as DateNavPeriod) ?? "today");
  const range = getDateRange(period, date ? new Date(date) : undefined);

  // --- Code-driven filter page ---
  if (FILTER_IDS.has(slug)) {
    const filterId = slug as FilterId;
    const meta = FILTER_PAGE_META[filterId];
    const allPredictions = await getFreePredictions(range);
    const predictions = applyPredictionFilter(allPredictions, filterId);

    return (
      <>
        <TipsHero title={meta.title} subtitle={meta.subtitle} activeFilter={filterId} />
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">{meta.description}</p>
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-muted-foreground">{range.label}</p>
            <DateNav active={period} basePath={`/tips/${slug}`} currentDate={range.date} />
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <PredictionList predictions={predictions} />
          </div>
        </div>
      </>
    );
  }

  // --- Custom DB page fallback ---
  const page = await getCustomPageBySlug(slug);
  if (!page) notFound();

  const allPredictions = await getFreePredictions(range);
  const predictions = applyPredictionFilter(allPredictions, page.filter_id ?? "all");

  return (
    <>
      <TipsHero
        title={page.heading ?? page.title}
        subtitle={page.subheading ?? ""}
        activeFilter={page.filter_id ?? "all"}
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {page.description && <p className="text-sm text-muted-foreground">{page.description}</p>}
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{range.label}</p>
          <DateNav active={period} basePath={`/tips/${slug}`} currentDate={range.date} />
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <PredictionList predictions={predictions} />
        </div>
      </div>
    </>
  );
}
