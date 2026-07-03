"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  ChevronLeft,
  CreditCard,
  Crown,
  Mail,
  MapPin,
  Phone,
  Target,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COUNTRIES } from "@/lib/constants";
import { resolvePrice } from "@/lib/utils/resolve-price";
import { getCurrencyFromCountry } from "@/lib/utils/currency";
import { PriceTag } from "@/components/site/price-tag";
import type { Tables } from "@/types/database";

const ICONS: Record<string, typeof Crown> = { "correct-scores": Target };
const FLOW_STEPS = [2, 3, 4] as const;

type FlowStep = (typeof FLOW_STEPS)[number];

export function SubscriptionsClient({
  plans,
  prices,
  defaultCountry,
  highlightSlug,
  isLoggedIn,
}: {
  plans: Tables<"plans">[];
  prices: Record<string, Tables<"plan_prices">[]>;
  defaultCountry: string;
  highlightSlug?: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [duration, setDuration] = useState<"7" | "30">("30");
  const [selectedPlan, setSelectedPlan] = useState<Tables<"plans"> | null>(null);
  const [step, setStep] = useState<FlowStep>(2);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [hasSelectedCountry, setHasSelectedCountry] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const selectedCurrency = useMemo(() => getCurrencyFromCountry(selectedCountry), [selectedCountry]);

  const openPlan = useCallback(
    (plan: Tables<"plans">) => {
      if (!hasSelectedCountry) {
        toast.error("Select your country to see pricing first");
        return;
      }
      if (!isLoggedIn) {
        router.push(`/signup?redirect=${encodeURIComponent(`/pricing?plan=${plan.slug}`)}`);
        return;
      }
      setSelectedPlan(plan);
      setStep(2);
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setDuration("30");
    },
    [hasSelectedCountry, isLoggedIn, router],
  );

  const durationDays = Number(duration) as 7 | 30;
  const selectedPrice = selectedPlan
    ? resolvePrice(prices[selectedPlan.id] ?? [], selectedCountry, durationDays)
    : null;

  function handleBack() {
    if (step === 2) {
      setSelectedPlan(null);
      return;
    }

    setStep((current) => (current - 1) as FlowStep);
  }

  function handleNext() {
    if (step === 2) {
      if (!contactName.trim()) return toast.error("Enter your name");
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!contactPhone.trim()) return toast.error("Enter your phone number");
      setStep(4);
      return;
    }

    if (!selectedPlan) return;
    if (!selectedCountry) return toast.error("Select your country");
    if (!/^\S+@\S+\.\S+$/.test(contactEmail.trim())) return toast.error("Enter a valid email address");
    if (!selectedPrice) return toast.error("No pricing available for your country yet");

    const params = new URLSearchParams({
      plan: selectedPlan.slug,
      duration,
      country: selectedCountry,
      name: contactName.trim(),
      phone: contactPhone.trim(),
      email: contactEmail.trim(),
    });

    setSelectedPlan(null);
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center sm:flex-row sm:text-left">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-brand">
          <MapPin className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <Label className="justify-center sm:justify-start">Select your country first</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasSelectedCountry
              ? `Prices are shown for ${selectedCountry} (${selectedCurrency}).`
              : "Select your country to reveal package pricing."}
          </p>
        </div>
        <SearchableSelect
          value={hasSelectedCountry ? selectedCountry : ""}
          onChange={(value) => {
            setSelectedCountry(value);
            setHasSelectedCountry(true);
          }}
          options={COUNTRIES}
          searchPlaceholder="Search countries..."
          className="w-full sm:w-48"
        />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const Icon = ICONS[plan.slug] ?? Crown;
          const previewPrice =
            resolvePrice(prices[plan.id] ?? [], selectedCountry, 30) ??
            resolvePrice(prices[plan.id] ?? [], selectedCountry, 7);
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
                {!hasSelectedCountry ? (
                  <p className="text-sm text-muted-foreground">Select your country to see pricing</p>
                ) : previewPrice ? (
                  <p className="flex flex-wrap items-baseline gap-1">
                    <PriceTag
                      price={previewPrice.price}
                      compareAtPrice={previewPrice.compare_at_price}
                      currency={previewPrice.currency}
                    />
                    <span className="text-sm font-normal text-muted-foreground">
                      / {previewPrice.duration_days === 7 ? "week" : "month"}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Pricing coming soon</p>
                )}
              </div>
              <Button className="mt-4" onClick={() => openPlan(plan)}>
                Select Package
                <ArrowRight className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <p className="text-xs font-semibold uppercase text-brand">Step {step}</p>
            <DialogTitle>{selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              {step === 2 && "Enter the name we should attach to your payment."}
              {step === 3 && "Add the phone or WhatsApp number support can reach."}
              {step === 4 && "Enter your email and confirm the package length."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2" aria-hidden>
            {FLOW_STEPS.map((flowStep) => (
              <div
                key={flowStep}
                className={`h-1.5 rounded-full ${flowStep <= step ? "bg-brand" : "bg-muted"}`}
              />
            ))}
          </div>

          {step === 2 && (
            <div className="space-y-3 py-2">
              <div className="flex size-11 items-center justify-center rounded-full bg-accent text-brand">
                <User className="size-5" />
              </div>
              <div className="space-y-2">
                <Label>Your name</Label>
                <Input
                  autoFocus
                  className="h-11 text-base"
                  placeholder="Your name"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 py-2">
              <div className="flex size-11 items-center justify-center rounded-full bg-accent text-brand">
                <Phone className="size-5" />
              </div>
              <div className="space-y-2">
                <Label>Your phone number</Label>
                <Input
                  autoFocus
                  className="h-11 text-base"
                  placeholder="+234..."
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  Your email
                </Label>
                <Input
                  autoFocus
                  type="email"
                  className="h-11 text-base"
                  placeholder="your@email.com"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Package length</Label>
                <Tabs value={duration} onValueChange={(value) => setDuration(value as "7" | "30")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="7">1 Week</TabsTrigger>
                    <TabsTrigger value="30">1 Month</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="rounded-xl border border-border bg-secondary p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Package</span>
                  <span className="text-right font-medium">{selectedPlan?.name}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Country</span>
                  <span className="text-right font-medium">{selectedCountry}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{duration === "7" ? "1 Week" : "1 Month"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2">
                  <span className="font-medium">Total</span>
                  {selectedPrice ? (
                    <PriceTag
                      price={selectedPrice.price}
                      compareAtPrice={selectedPrice.compare_at_price}
                      currency={selectedPrice.currency}
                      size="sm"
                    />
                  ) : (
                    <span className="text-lg font-bold">Unavailable</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={handleBack}>
              {step === 2 ? "Cancel" : (
                <>
                  <ChevronLeft className="size-4" />
                  Back
                </>
              )}
            </Button>
            <Button onClick={handleNext}>
              {step === 4 ? (
                <>
                  <CreditCard className="size-4" />
                  Payment Details
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
