import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlanBySlug } from "@/lib/data/plans";
import { getCurrentUser } from "@/lib/data/current-user";
import { getUserSubscriptionForPlan } from "@/lib/data/subscriptions";
import { getPredictionsForPlan } from "@/lib/data/predictions";
import { getDateRange } from "@/lib/utils/date";
import { isPlanUnlocked, isPendingActivation, isExpired } from "@/lib/plan-access";
import { VIP_PLAN_SLUGS } from "@/lib/constants";
import { PlanResultsPanel } from "@/components/winnings/plan-results-panel";
import { VipLockedCard } from "@/components/dashboard/vip-locked-card";
import { VipPendingActivationCard } from "@/components/dashboard/vip-pending-activation-card";
import { VipExpiredCard } from "@/components/dashboard/vip-expired-card";
import { PlanCountdown } from "@/components/dashboard/plan-countdown";
import { PredictionList } from "@/components/predictions/prediction-list";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const plan = await getPlanBySlug(slug);
  return { title: plan ? plan.name : "VIP Zone" };
}

export default async function VipZonePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ resultsDate?: string }>;
}) {
  const { slug } = await params;
  if (!(VIP_PLAN_SLUGS as readonly string[]).includes(slug)) notFound();

  const plan = await getPlanBySlug(slug);
  if (!plan) notFound();

  const user = await getCurrentUser();
  if (!user) notFound();

  const { resultsDate } = await searchParams;
  const subscription = await getUserSubscriptionForPlan(user.authId, plan.id);

  const unlocked = isPlanUnlocked(plan, subscription);
  const pendingActivation = isPendingActivation(plan, subscription);
  const expired = isExpired(subscription);

  const basePath = `/dashboard/vip/${slug}`;

  return (
    <div>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">VIP Zone</p>
        <h1 className="mt-1 text-2xl font-bold">{plan.name}</h1>
        <p className="text-sm text-muted-foreground">Exclusive access. Premium results.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {unlocked ? (
            <UnlockedPanel
              planId={plan.id}
              planName={plan.name}
              expiryDate={subscription!.expiry_date}
            />
          ) : pendingActivation ? (
            <VipPendingActivationCard planSlug={slug} />
          ) : expired ? (
            <VipExpiredCard planSlug={slug} />
          ) : (
            <VipLockedCard planSlug={slug} />
          )}
        </div>
        <PlanResultsPanel planId={plan.id} basePath={basePath} resultsDate={resultsDate} />
      </div>

      {!unlocked && (
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-ink p-6 text-center text-ink-foreground sm:flex-row sm:text-left">
          <p className="font-medium">Join VIP now and unlock expert picks, combos and exclusive insights!</p>
          <a
            href={`/pricing?plan=${slug}`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
          >
            Upgrade Now
          </a>
        </div>
      )}
    </div>
  );
}

async function UnlockedPanel({
  planId,
  expiryDate,
}: {
  planId: string;
  planName: string;
  expiryDate: string | null;
}) {
  const range = getDateRange("today");
  const predictions = await getPredictionsForPlan(planId, range, { unlocked: true });

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold uppercase tracking-wide text-brand">Today&apos;s Predictions</h3>
          <p className="text-sm text-muted-foreground">{range.label}</p>
        </div>
        {expiryDate && <PlanCountdown expiryDate={expiryDate} />}
      </div>
      <div className="mt-4">
        <PredictionList predictions={predictions} />
      </div>
    </div>
  );
}
