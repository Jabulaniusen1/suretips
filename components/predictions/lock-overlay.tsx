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
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-black/75 px-6 text-center backdrop-blur-sm">
      <div className="flex size-16 items-center justify-center rounded-full border-2 border-brand/70 text-brand">
        <Lock className="size-7" />
      </div>
      <h3 className="text-lg font-bold uppercase tracking-wide text-white">{title}</h3>
      <p className="max-w-xs text-sm text-zinc-300">{message}</p>
      <Button className="mt-1" render={<Link href={ctaHref} />}>
        {ctaLabel}
      </Button>
      {showTrustBadges && (
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.title} className="max-w-26 text-center">
              <p className="text-xs font-semibold text-white">{badge.title}</p>
              <p className="mt-0.5 text-[10px] text-zinc-400">{badge.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
