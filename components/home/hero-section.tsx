import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, RefreshCw, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteConfig } from "@/lib/data/site-config";
import { getFreePredictions } from "@/lib/data/predictions";
import { getDateRange } from "@/lib/utils/date";

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Verified daily results" },
  { icon: RefreshCw, label: "Picks updated round the clock" },
  { icon: CreditCard, label: "Simple manual payments" },
];

export async function HeroSection() {
  const config = await getSiteConfig();
  const todaysPredictions = await getFreePredictions(getDateRange("today"));
  const topPick = [...todaysPredictions].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0] ?? null;

  return (
    <section className="relative overflow-hidden bg-ink text-ink-foreground">
      <Image src="/1452532206-messi.avif" alt="" fill priority className="object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, var(--brand-orange) 0%, transparent 35%), radial-gradient(circle at 80% 0%, var(--brand-orange) 0%, transparent 25%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-8 lg:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Football Predictions, Proven</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">{config.hero.headline}</h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-300">{config.hero.subtext}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg" render={<Link href="/subscriptions" />}>
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
              <div key={item.label} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                <item.icon className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>{item.label}</span>
              </div>
            ))}
          </dl>
        </div>

        {topPick && (
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">Today&apos;s Free Pick</p>
              <p className="mt-2 truncate font-bold">
                {topPick.home_team} <span className="font-normal text-zinc-400">vs</span> {topPick.away_team}
              </p>
              <p className="text-sm text-zinc-400">{topPick.league ?? "Football"}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-medium text-white">{topPick.prediction_type}</span>
                {topPick.odds && <span className="font-semibold text-brand">Odds {topPick.odds}</span>}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full border-white/30 bg-white/5 text-white hover:bg-white/10"
                render={<Link href="#free-predictions" />}
              >
                See Today&apos;s Free Tips
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
