import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRUST_BADGES } from "@/lib/constants";

export function VipLockedCard({ planSlug }: { planSlug: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-bold uppercase tracking-wide text-brand">VIP Packages</h3>
      <p className="text-sm text-muted-foreground">Unlock premium picks and maximize your wins.</p>

      <div className="mt-6 flex flex-col items-center rounded-xl bg-ink p-8 text-center text-ink-foreground">
        <div className="flex size-16 items-center justify-center rounded-full border-2 border-brand text-brand">
          <Lock className="size-7" />
        </div>
        <h4 className="mt-4 text-lg font-bold uppercase tracking-wide">This Section Is Locked</h4>
        <p className="mt-2 max-w-xs text-sm text-zinc-300">
          Upgrade to a VIP package to access premium picks and exclusive analysis.
        </p>
        <Button className="mt-5" render={<Link href={`/pricing?plan=${planSlug}`} />}>
          Unlock VIP Access
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {TRUST_BADGES.map((badge) => (
          <div key={badge.title} className="text-center">
            <p className="text-xs font-semibold">{badge.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{badge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
