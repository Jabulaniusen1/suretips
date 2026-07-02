import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VipExpiredCard({ planSlug }: { planSlug: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <Clock className="mx-auto size-8 text-muted-foreground" />
      <h3 className="mt-3 font-bold">Your subscription has expired</h3>
      <p className="mt-1 text-sm text-muted-foreground">Renew now to keep getting daily predictions.</p>
      <Button className="mt-4" render={<Link href={`/pricing?plan=${planSlug}`} />}>
        Renew Subscription
      </Button>
    </div>
  );
}
