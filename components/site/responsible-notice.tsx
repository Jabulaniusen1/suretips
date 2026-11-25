import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResponsibleNotice({ className }: { className?: string }) {
  return (
    <aside className={cn("flex gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground", className)}>
      <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
      <p>
        <strong className="text-foreground">18+ only. Predictions are not guarantees.</strong> Football is unpredictable and every bet can
        lose. Only stake what you can afford to lose, never chase losses, and read our{" "}
        <Link href="/responsible-betting" className="font-medium text-brand hover:underline">
          responsible betting guide
        </Link>{" "}
        if betting stops being fun.
      </p>
    </aside>
  );
}
