"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, CheckCircle, Copy, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { submitCheckout } from "@/lib/actions/checkout";
import type { Tables } from "@/types/database";

export function CheckoutClient({
  plan,
  price,
  amount,
  paymentMethods,
  duration,
  supportLink,
}: {
  plan: Tables<"plans">;
  price: Tables<"plan_prices">;
  amount: number;
  paymentMethods: Tables<"payment_methods">[];
  duration: 7 | 30;
  supportLink: string;
}) {
  const [methodId, setMethodId] = useState<string | undefined>(paymentMethods[0]?.id);
  const [file, setFile] = useState<File | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedMethod = paymentMethods.find((m) => m.id === methodId);

  function copyDetail(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  async function handleSubmit() {
    if (!selectedMethod) return toast.error("Select a payment method");
    if (!file) return toast.error("Upload your proof of payment");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("planId", plan.id);
      formData.append("amount", String(amount));
      formData.append("currency", price.currency);
      formData.append("duration", String(duration));
      formData.append("methodId", selectedMethod.id);
      formData.append("methodName", selectedMethod.name);
      if (contactName) formData.append("contactName", contactName);
      if (contactEmail) formData.append("contactEmail", contactEmail);
      if (contactPhone) formData.append("contactPhone", contactPhone);

      await submitCheckout(formData);
      setSubmitted(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
        <div className="flex justify-center">
          <CheckCircle className="size-14 text-brand" />
        </div>
        <h2 className="mt-4 text-xl font-bold">Payment Proof Received!</h2>
        <p className="mt-2 text-muted-foreground">
          Our team will verify your proof of payment. Once confirmed, you&apos;ll receive a{" "}
          <strong>5-digit access code</strong> — message our support team to provide your contact
          details and get your code.
        </p>
        {supportLink ? (
          <Button
            className="mt-6 w-full"
            size="lg"
            render={<a href={supportLink} target="_blank" rel="noopener noreferrer" />}
          >
            <MessageCircle className="mr-2 size-4" />
            Message Support
            <ExternalLink className="ml-2 size-3.5" />
          </Button>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Contact our support team to receive your access code once payment is verified.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-bold">Order Summary</h2>
          <div className="mt-4 flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="font-medium">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {duration === 7 ? "1 Week" : "1 Month"} Subscription
              </p>
            </div>
            <p className="text-xl font-bold">{formatPrice(amount, price.currency)}</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            After you submit your proof of payment, our team manually verifies it and sends you an
            access code — usually within a few hours.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-bold">Your Contact Info</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            So we can reach you with your access code. No account needed.
          </p>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                placeholder="Your name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Phone / WhatsApp</Label>
              <Input
                placeholder="+234..."
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>
        </div>
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
              <span className="ml-auto text-xs uppercase text-muted-foreground">
                {method.type.replace("_", " ")}
              </span>
            </label>
          ))}
          {paymentMethods.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No payment methods configured for your country yet.
            </p>
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
            <span className="text-sm text-muted-foreground">
              Click to upload a screenshot or receipt
            </span>
          )}
        </label>

        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting || paymentMethods.length === 0}
        >
          {submitting ? "Submitting…" : "Submit Payment Proof"}
        </Button>
      </div>
    </div>
  );
}
