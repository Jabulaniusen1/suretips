import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRUST_BADGES } from "@/lib/constants";

export function LockOverlay({
  title = "This Section Is Locked",
  message = "Upgrade to a VIP package to access premium picks and exclusive analysis.",
  ctaHref,
  ctaLabel = "Unlock VIP Access",
  showTrustBadges = true,
}: {
  title?: string;
  message?: string;
  ctaHref: string;
  ctaLabel?: string;
  showTrustBadges?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl bg-ink/95 px-6 py-8 text-center backdrop-blur-md">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 0%, var(--brand-red) 0%, transparent 45%)",
        }}
      />

      <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand/70 text-brand-foreground shadow-lg shadow-brand/30">
        <Lock className="size-7" />
      </div>

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">VIP Exclusive</p>
        <h3 className="mt-2 text-xl font-bold text-white">{title}</h3>
        <p className="mt-2 max-w-xs text-sm text-zinc-300">{message}</p>
      </div>

      <Button size="lg" className="relative" render={<Link href={ctaHref} />}>
        {ctaLabel}
      </Button>

      {showTrustBadges && (
        <div className="relative mt-2 flex flex-wrap justify-center gap-x-8 gap-y-3 border-t border-white/10 pt-4">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.title} className="max-w-32 text-center">
              <p className="text-xs font-semibold text-white">{badge.title}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">{badge.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
