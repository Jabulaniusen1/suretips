"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crown, KeyRound, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { COUNTRIES } from "@/lib/constants";
import { resolvePrice } from "@/lib/utils/resolve-price";
import { formatPrice, getCurrencyFromCountry } from "@/lib/utils/currency";
import { activateAccessCode } from "@/lib/actions/access-codes";
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
  const router = useRouter();
  const [country, setCountry] = useState(defaultCountry);
  const [duration, setDuration] = useState<"7" | "30">("30");
  const [selectedPlan, setSelectedPlan] = useState<Tables<"plans"> | null>(null);
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  const currency = useMemo(() => getCurrencyFromCountry(country), [country]);

  function handlePlanClick(plan: Tables<"plans">) {
    setSelectedPlan(plan);
    setCode("");
  }

  function handleActivate() {
    if (!code.trim()) return toast.error("Enter your access code");
    startTransition(async () => {
      try {
        const { planSlug } = await activateAccessCode(code.trim());
        toast.success("Access code activated!");
        router.push(`/plans/${planSlug}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invalid access code");
      }
    });
  }

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
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}/ {duration === "7" ? "week" : "month"}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Pricing coming soon</p>
                )}
              </div>
              <Button
                className="mt-4"
                onClick={() => handlePlanClick(plan)}
              >
                Get Access
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Prices shown in {currency}. You can change your country above.
      </p>

      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.name}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="code" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="code" className="flex-1">
                <KeyRound className="mr-2 size-4" />
                Enter Access Code
              </TabsTrigger>
              <TabsTrigger value="subscribe" className="flex-1">
                Subscribe
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Already have a 5-digit access code? Enter it below to unlock this plan instantly.
              </p>
              <Input
                placeholder="Enter your 5-digit code"
                maxLength={5}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="font-mono text-center text-lg tracking-[0.5em]"
              />
              <Button
                className="w-full"
                onClick={handleActivate}
                disabled={isPending || code.length !== 5}
              >
                {isPending ? "Activating…" : "Activate Access"}
              </Button>
            </TabsContent>

            <TabsContent value="subscribe" className="mt-4 space-y-4">
              {selectedPlan && (() => {
                const price = resolvePrice(prices[selectedPlan.id] ?? [], country, Number(duration) as 7 | 30);
                return (
                  <>
                    <div className="rounded-xl border border-border bg-secondary p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium">{selectedPlan.name}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{duration === "7" ? "1 Week" : "1 Month"}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-muted-foreground">Country</span>
                        <span className="font-medium">{country}</span>
                      </div>
                      {price && (
                        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                          <span className="font-medium">Total</span>
                          <span className="text-lg font-bold">{formatPrice(price.price, price.currency)}</span>
                        </div>
                      )}
                    </div>
                    {price ? (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setSelectedPlan(null);
                          router.push(
                            `/checkout?plan=${selectedPlan.slug}&duration=${duration}&country=${encodeURIComponent(country)}`
                          );
                        }}
                      >
                        Proceed to Checkout
                      </Button>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        No pricing available for your country yet.
                      </p>
                    )}
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
