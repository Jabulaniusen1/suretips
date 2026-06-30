import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlanBySlug } from "@/lib/data/plans";
import { getPlanPrices, resolvePrice } from "@/lib/data/plan-prices";
import { getPaymentMethodsForCountry } from "@/lib/data/payment-methods";
import { getCurrentUser } from "@/lib/data/current-user";
import { getUserSubscriptionForPlan } from "@/lib/data/subscriptions";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; duration?: string; country?: string; type?: string }>;
}) {
  const { plan: planSlug, duration: durationParam, country: countryParam, type } = await searchParams;
  if (!planSlug) redirect("/subscriptions");

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/checkout?plan=${planSlug}`)}`);

  const plan = await getPlanBySlug(planSlug);
  if (!plan) notFound();

  const transactionType = type === "activation" ? "activation" : "subscription";
  if (transactionType === "activation" && !plan.requires_activation) redirect(`/dashboard/vip/${plan.slug}`);

  const subscription = await getUserSubscriptionForPlan(user.authId, plan.id);
  const country = countryParam ?? user.profile.country;
  const duration = (durationParam === "7" ? 7 : 30) as 7 | 30;

  const prices = await getPlanPrices(plan.id);
  const price = resolvePrice(prices, country, duration);
  if (!price) redirect("/subscriptions");

  const amount = transactionType === "activation" ? price.activation_fee ?? price.price : price.price;
  const paymentMethods = await getPaymentMethodsForCountry(country);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Checkout — {plan.name}</h1>
        <p className="text-sm text-muted-foreground">Country: {country}</p>
      </div>
      <CheckoutClient
        plan={plan}
        price={price}
        amount={amount}
        paymentMethods={paymentMethods}
        transactionType={transactionType}
        userId={user.authId}
        duration={duration}
        existingSubscriptionId={subscription?.id}
      />
    </div>
  );
}
