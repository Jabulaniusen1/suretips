"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Crown, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COUNTRIES } from "@/lib/constants";
import { resolvePrice } from "@/lib/utils/resolve-price";
import { formatPrice, getCurrencyFromCountry } from "@/lib/utils/currency";
import type { Tables } from "@/types/database";

const ICONS: Record<string, typeof Crown> = { "correct-scores": Target };

export function SubscriptionsClient({
  plans,
  prices,
  defaultCountry,
  highlightSlug,
}: {
  plans: Tables<"plans">[];
  prices: Record<string, Tables<"plan_prices">[]>;
  defaultCountry: string;
  highlightSlug?: string;
}) {
  const [country, setCountry] = useState(defaultCountry);
  const [duration, setDuration] = useState<"7" | "30">("30");

  const currency = useMemo(() => getCurrencyFromCountry(country), [country]);

  return (
    <div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Country</span>
          <SearchableSelect
            value={country}
            onChange={setCountry}
            options={COUNTRIES}
            searchPlaceholder="Search countries…"
            className="w-44"
          />
        </div>
        <Tabs value={duration} onValueChange={(v) => setDuration(v as "7" | "30")}>
          <TabsList>
            <TabsTrigger value="7">1 Week</TabsTrigger>
            <TabsTrigger value="30">1 Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const Icon = ICONS[plan.slug] ?? Crown;
          const price = resolvePrice(prices[plan.id] ?? [], country, Number(duration) as 7 | 30);
          const highlighted = plan.slug === highlightSlug;

          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-6 ${highlighted ? "border-brand shadow-lg" : "border-border"} bg-card`}
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-accent text-brand">
                <Icon className="size-6" />
              </div>
              <h3 className="mt-4 font-bold">{plan.name}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {plan.benefits.slice(0, 3).map((benefit) => (
                  <li key={benefit}>• {benefit}</li>
                ))}
              </ul>
              {plan.requires_activation && (
                <Badge variant="secondary" className="mt-3 w-fit">
                  Two-step unlock
                </Badge>
              )}
              <div className="mt-4">
                {price ? (
                  <p className="text-2xl font-extrabold">
                    {formatPrice(price.price, price.currency)}
                    <span className="text-sm font-normal text-muted-foreground"> / {duration === "7" ? "week" : "month"}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Pricing coming soon</p>
                )}
                {plan.requires_activation && price?.activation_fee && (
                  <p className="text-xs text-muted-foreground">
                    + {formatPrice(price.activation_fee, price.currency)} activation fee
                  </p>
                )}
              </div>
              <Button
                className="mt-4"
                disabled={!price}
                render={
                  <Link href={`/checkout?plan=${plan.slug}&duration=${duration}&country=${encodeURIComponent(country)}`} />
                }
              >
                Subscribe Now
              </Button>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Prices shown in {currency}. You can change your country at checkout or in account settings.
      </p>
    </div>
  );
}
