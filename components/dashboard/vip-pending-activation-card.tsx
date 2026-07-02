import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VipPendingActivationCard({ planSlug }: { planSlug: string }) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <TriangleAlert className="size-5" />
        <h3 className="font-bold">Pending Activation</h3>
      </div>
      <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
        You&apos;ve subscribed but need to pay the Activation Fee to unlock 100% accurate predictions.
      </p>
      <Button className="mt-4" render={<Link href={`/pricing?plan=${planSlug}`} />}>
        Pay Activation Fee
      </Button>
    </div>
  );
}
