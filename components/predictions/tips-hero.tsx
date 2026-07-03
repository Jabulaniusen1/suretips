import Image from "next/image";
import { FilterTabs } from "@/components/predictions/filter-tabs";

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
            "radial-gradient(circle at 15% 50%, var(--brand-red) 0%, transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">Free Predictions</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-xl text-base text-zinc-300">{subtitle}</p>

        <div className="mt-8">
          <FilterTabs active={activeFilter} variant="dark" />
        </div>
      </div>
    </section>
  );
}
