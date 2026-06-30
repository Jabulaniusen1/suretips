"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

export function CheckoutClient({
  plan,
  price,
  amount,
  paymentMethods,
  transactionType,
  userId,
  duration,
  existingSubscriptionId,
}: {
  plan: Tables<"plans">;
  price: Tables<"plan_prices">;
  amount: number;
  paymentMethods: Tables<"payment_methods">[];
  transactionType: "subscription" | "activation";
  userId: string;
  duration: 7 | 30;
  existingSubscriptionId?: string;
}) {
  const router = useRouter();
  const [methodId, setMethodId] = useState<string | undefined>(paymentMethods[0]?.id);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedMethod = paymentMethods.find((m) => m.id === methodId);

  function copyDetail(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  async function handleSubmit() {
    if (!selectedMethod) return toast.error("Select a payment method");
    if (!file) return toast.error("Upload your proof of payment");

    setSubmitting(true);
    const supabase = createClient();

    try {
      const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (uploadError) throw uploadError;

      let subscriptionId = existingSubscriptionId;

      if (transactionType === "subscription") {
        const { data: subscription, error: subError } = await supabase
          .from("user_subscriptions")
          .upsert(
            {
              user_id: userId,
              plan_id: plan.id,
              plan_status: "pending",
              subscription_fee_paid: false,
              activation_fee_paid: false,
            },
            { onConflict: "user_id,plan_id" }
          )
          .select()
          .single();
        if (subError) throw subError;
        subscriptionId = subscription.id;
      }

      const { error: txError } = await supabase.from("transactions").insert({
        user_id: userId,
        subscription_id: subscriptionId,
        plan_id: plan.id,
        amount,
        currency: price.currency,
        payment_method_name: selectedMethod.name,
        payment_type: transactionType,
        status: "pending",
        metadata: { payment_proof_url: path, duration_days: duration, payment_method_id: selectedMethod.id },
      });
      if (txError) throw txError;

      await supabase.from("notifications").insert({
        user_id: userId,
        type: "payment_submitted",
        title: "Payment submitted",
        message: `Your ${transactionType === "activation" ? "activation fee" : "subscription"} payment for ${plan.name} is pending review. We'll notify you once it's confirmed.`,
      });

      toast.success("Payment submitted! We'll confirm it shortly.");
      router.push(`/dashboard/vip/${plan.slug}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-bold">Order Summary</h2>
        <div className="mt-4 flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="font-medium">{plan.name}</p>
            <p className="text-sm text-muted-foreground">
              {transactionType === "activation" ? "Activation Fee" : `${duration === 7 ? "1 Week" : "1 Month"} Subscription`}
            </p>
          </div>
          <p className="text-xl font-bold">{formatPrice(amount, price.currency)}</p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          After you submit your proof of payment, our team manually verifies it and activates your access —
          usually within a few hours.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-bold">1. Choose a payment method</h2>
        <RadioGroup value={methodId} onValueChange={setMethodId} className="mt-3 space-y-2">
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              htmlFor={method.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3",
                methodId === method.id ? "border-brand bg-accent" : "border-border"
              )}
            >
              <RadioGroupItem value={method.id} id={method.id} />
              <span className="font-medium">{method.name}</span>
              <span className="ml-auto text-xs uppercase text-muted-foreground">{method.type.replace("_", " ")}</span>
            </label>
          ))}
          {paymentMethods.length === 0 && (
            <p className="text-sm text-muted-foreground">No payment methods configured for your country yet.</p>
          )}
        </RadioGroup>

        {selectedMethod && (
          <div className="mt-4 space-y-2 rounded-xl bg-secondary p-4">
            {Object.entries(selectedMethod.details as Record<string, string>).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-2 text-sm">
                <span className="capitalize text-muted-foreground">{key.replace(/_/g, " ")}</span>
                <button
                  type="button"
                  onClick={() => copyDetail(String(value))}
                  className="flex items-center gap-1 font-medium hover:text-brand"
                >
                  {value} <Copy className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-6 font-bold">2. Upload proof of payment</h2>
        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center hover:border-brand">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <span className="flex items-center gap-2 text-sm font-medium text-brand">
              <Check className="size-4" /> {file.name}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Click to upload a screenshot or receipt</span>
          )}
        </label>

        <Button className="mt-6 w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Payment Proof"}
        </Button>
      </div>
    </div>
  );
}
