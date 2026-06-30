import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCustomPageBySlug } from "@/lib/data/custom-pages";
import { getFreePredictions } from "@/lib/data/predictions";
import { getDateRange, type DateNavPeriod } from "@/lib/utils/date";
import { applyPredictionFilter } from "@/lib/utils/prediction-filter";
import { DateNav } from "@/components/predictions/date-nav";
import { PredictionList } from "@/components/predictions/prediction-list";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
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
  const page = await getCustomPageBySlug(slug);
  if (!page) notFound();

  const period = date ? "custom" : ((periodParam as DateNavPeriod) ?? "today");
  const range = getDateRange(period, date ? new Date(date) : undefined);
  const allPredictions = await getFreePredictions(range);
  const predictions = applyPredictionFilter(allPredictions, page.filter_id ?? "all");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">{page.heading ?? page.title}</h1>
      {page.subheading && <p className="mt-2 text-muted-foreground">{page.subheading}</p>}
      {page.description && <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{page.description}</p>}

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{range.label}</p>
        <DateNav active={period} basePath={`/tips/${slug}`} currentDate={range.date} />
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <PredictionList predictions={predictions} />
      </div>
    </div>
  );
}
