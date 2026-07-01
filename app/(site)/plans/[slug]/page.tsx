import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlanBySlug } from "@/lib/data/plans";
import { verifyAccessCode } from "@/lib/data/access-codes";
import { getPredictionsForPlan } from "@/lib/data/predictions";
import { getDateRange } from "@/lib/utils/date";
import { AccessCodeGate } from "@/components/plans/access-code-gate";
import { PredictionList } from "@/components/predictions/prediction-list";
import { PlanCountdown } from "@/components/dashboard/plan-countdown";
import { PlanResultsPanel } from "@/components/winnings/plan-results-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plan = await getPlanBySlug(slug);
  return { title: plan ? `${plan.name} — VIP Access` : "VIP Access" };
}

export default async function PlanAccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ resultsDate?: string }>;
}) {
  const { slug } = await params;
  const { resultsDate } = await searchParams;

  const plan = await getPlanBySlug(slug);
  if (!plan) notFound();

  const cookieStore = await cookies();
  const codeCookie = cookieStore.get(`access_${plan.slug}`)?.value;

  let accessCode = null;
  if (codeCookie) {
    accessCode = await verifyAccessCode(codeCookie, plan.slug);
  }

  const basePath = `/plans/${slug}`;

  if (!accessCode) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <AccessCodeGate plan={plan} />
      </div>
    );
  }

  const range = getDateRange("today");
  const predictions = await getPredictionsForPlan(plan.id, range, { unlocked: true });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">VIP Access</p>
        <h1 className="mt-1 text-2xl font-bold">{plan.name}</h1>
        <p className="text-sm text-muted-foreground">Exclusive access. Premium results.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold uppercase tracking-wide text-brand">
                Today&apos;s Predictions
              </h3>
              <p className="text-sm text-muted-foreground">{range.label}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <PlanCountdown expiryDate={accessCode.expires_at} />
              <p className="text-xs text-muted-foreground">Code: {accessCode.code}</p>
            </div>
          </div>
          <div className="mt-4">
            <PredictionList predictions={predictions} />
          </div>
        </div>

        <PlanResultsPanel planId={plan.id} basePath={basePath} resultsDate={resultsDate} />
      </div>
    </div>
  );
}
