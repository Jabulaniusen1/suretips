import Image from "next/image";
import Link from "next/link";
import { FREE_PREDICTIONS_FILTERS } from "@/lib/utils/prediction-filter";
import { cn } from "@/lib/utils";

export function TipsHero({
  title,
  subtitle,
  activeFilter,
}: {
  title: string;
  subtitle: string;
  activeFilter: string;
}) {
  return (
    <section className="relative overflow-hidden bg-ink text-ink-foreground">
      <Image src="/1452532206-messi.avif" alt="" fill priority className="object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 50%, var(--brand-orange) 0%, transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">Free Predictions</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-xl text-base text-zinc-300">{subtitle}</p>

        {/* Filter tabs */}
        <div className="-mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 pb-1">
            {FREE_PREDICTIONS_FILTERS.map((f) => (
              <Link
                key={f.id}
                href={`/tips/${f.id}`}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  activeFilter === f.id
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-white/20 text-zinc-300 hover:border-brand/60 hover:text-white"
                )}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
