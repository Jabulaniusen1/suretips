import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlanBySlug } from "@/lib/data/plans";
import { getPlanPrices, resolvePrice } from "@/lib/data/plan-prices";
import { getPaymentMethodsForCountry } from "@/lib/data/payment-methods";
import { getCurrentUser } from "@/lib/data/current-user";
import { getSiteConfig } from "@/lib/data/site-config";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string;
    duration?: string;
    country?: string;
    name?: string;
    email?: string;
    phone?: string;
  }>;
}) {
  const {
    plan: planSlug,
    duration: durationParam,
    country: countryParam,
    name: nameParam,
    email: emailParam,
    phone: phoneParam,
  } = await searchParams;
  if (!planSlug) redirect("/pricing");

  const plan = await getPlanBySlug(planSlug);
  if (!plan) notFound();

  const user = await getCurrentUser();

  const country = countryParam ?? user?.profile.country ?? "Nigeria";
  const duration = (durationParam === "7" ? 7 : 30) as 7 | 30;

  const prices = await getPlanPrices(plan.id);
  const price = resolvePrice(prices, country, duration);
  if (!price) redirect("/pricing");

  const amount = price.price;
  const paymentMethods = await getPaymentMethodsForCountry(country);
  const config = await getSiteConfig();
  const supportLink =
    config.support_link ||
    (config.whatsapp_number ? `https://wa.me/${config.whatsapp_number.replace(/\D/g, "")}` : "") ||
    (config.contact_email ? `mailto:${config.contact_email}` : "");

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
        duration={duration}
        country={country}
        initialContact={{
          name: nameParam ?? "",
          email: emailParam ?? "",
          phone: phoneParam ?? "",
        }}
        supportLink={supportLink}
      />
    </div>
  );
}
