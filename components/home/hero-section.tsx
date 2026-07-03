import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, RefreshCw, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteConfig } from "@/lib/data/site-config";
import { getOverallWinningsStats } from "@/lib/data/winnings";

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Every result verified, published" },
  { icon: RefreshCw, label: "Fresh picks around the clock" },
  { icon: CreditCard, label: "Pay your way, no card required" },
];

export async function HeroSection() {
  const config = await getSiteConfig();
  const stats = await getOverallWinningsStats();

  return (
    <section className="relative overflow-hidden bg-ink text-ink-foreground">
      <Image src="/1452532206-messi.avif" alt="" fill priority className="object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, var(--brand-red) 0%, transparent 35%), radial-gradient(circle at 80% 0%, var(--brand-red) 0%, transparent 25%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-8 lg:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Proof Before Promises</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">{config.hero.headline}</h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-300">{config.hero.subtext}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg" render={<Link href="/pricing" />}>
              {config.hero.primary_cta_label}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-white backdrop-blur hover:bg-white/10"
              render={<a href={config.telegram_url} target="_blank" rel="noreferrer" />}
            >
              {config.hero.secondary_cta_label}
            </Button>
          </div>
          <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TRUST_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-brand/40 hover:bg-white/10"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
                  <item.icon className="size-3.5" />
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </dl>
        </div>

        {stats.totalPicks > 0 && (
          <div className="hidden lg:block">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-gold to-brand" />
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">Verified Track Record</p>
              <p className="mt-2 text-sm text-zinc-400">Last 30 days, across every VIP package.</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-white/10 bg-white/5 py-3">
                  <p className="text-2xl font-extrabold text-brand">{stats.successRate}%</p>
                  <p className="mt-1 text-[11px] text-zinc-400">Win Rate</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 py-3">
                  <p className="text-2xl font-extrabold text-gold">{stats.totalPicks}</p>
                  <p className="mt-1 text-[11px] text-zinc-400">Picks Tracked</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 py-3">
                  <p className="text-2xl font-extrabold text-white">{stats.winStreak}</p>
                  <p className="mt-1 text-[11px] text-zinc-400">Win Streak</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full border-white/30 bg-white/5 text-white hover:bg-white/10"
                render={<Link href="/previous-results" />}
              >
                See Full History
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
