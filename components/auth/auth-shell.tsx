import { ShieldCheck, TrendingUp } from "lucide-react";
import { Logo } from "@/components/site/logo";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-ink p-10 text-ink-foreground lg:flex">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--brand-red) 0%, transparent 35%), radial-gradient(circle at 80% 80%, var(--brand-gold) 0%, transparent 30%)",
          }}
        />
        <div className="relative">
          <Logo dark imgClassName="h-12 w-auto" />
        </div>
        <div className="relative max-w-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Proof Before Promises</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Your VIP picks, all in one place.</h2>
          <p className="mt-3 text-zinc-300">
            Log in to track your active packages, today&apos;s predictions, and your full winnings history.
          </p>
        </div>
        <div className="relative flex flex-wrap gap-6 text-sm text-zinc-400">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand" /> Verified results
          </span>
          <span className="flex items-center gap-2">
            <TrendingUp className="size-4 text-brand" /> Daily picks
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-secondary px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex justify-center lg:hidden">
            <Logo imgClassName="h-16 w-auto" />
          </div>
          <h1 className="mt-6 text-center text-2xl font-bold lg:mt-0 lg:text-left">{title}</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground lg:text-left">{description}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
