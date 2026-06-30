import type { Metadata } from "next";
import { getVipPlans } from "@/lib/data/plans";
import { getPlanPrices } from "@/lib/data/plan-prices";
import { getCurrentUser } from "@/lib/data/current-user";
import { SubscriptionsClient } from "@/components/subscriptions/subscriptions-client";

export const metadata: Metadata = { title: "VIP Subscriptions" };

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: highlightSlug } = await searchParams;
  const [plans, user] = await Promise.all([getVipPlans(), getCurrentUser()]);

  const prices = Object.fromEntries(
    await Promise.all(plans.map(async (plan) => [plan.id, await getPlanPrices(plan.id)] as const))
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">VIP Subscriptions</h1>
        <p className="mt-2 text-muted-foreground">Choose a package, pick your country and duration, and check out.</p>
      </div>
      <div className="mt-8">
        <SubscriptionsClient
          plans={plans}
          prices={prices}
          defaultCountry={user?.profile.country ?? "Nigeria"}
          highlightSlug={highlightSlug}
        />
      </div>
    </div>
  );
}
