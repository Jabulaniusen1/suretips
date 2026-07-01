"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { activateAccessCode } from "@/lib/actions/access-codes";
import type { Tables } from "@/types/database";

export function AccessCodeGate({ plan }: { plan: Tables<"plans"> }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleActivate() {
    if (code.length !== 5) return toast.error("Enter your 5-digit access code");
    startTransition(async () => {
      try {
        await activateAccessCode(code);
        toast.success("Access code activated!");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invalid access code");
      }
    });
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8 text-center">
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent">
          <KeyRound className="size-8 text-brand" />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold">{plan.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your access code or subscribe to unlock daily predictions.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-left">
        <h3 className="font-semibold">Have an access code?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your 5-digit code to activate access instantly.
        </p>
        <div className="mt-4 space-y-3">
          <Input
            placeholder="_ _ _ _ _"
            maxLength={5}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="font-mono text-center text-xl tracking-[0.75em]"
          />
          <Button
            className="w-full"
            onClick={handleActivate}
            disabled={isPending || code.length !== 5}
          >
            {isPending ? "Activating…" : "Activate Access"}
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-left">
        <h3 className="font-semibold">Subscribe</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay via bank transfer or crypto — no account needed.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {plan.benefits.slice(0, 3).map((b) => (
            <li key={b}>• {b}</li>
          ))}
        </ul>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => router.push(`/subscriptions?plan=${plan.slug}`)}
        >
          <ShoppingCart className="mr-2 size-4" />
          View Plans & Subscribe
        </Button>
      </div>
    </div>
  );
}
