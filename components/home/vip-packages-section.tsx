import Link from "next/link";
import { ArrowRight, Crown, Target } from "lucide-react";
import { getVipPlans } from "@/lib/data/plans";
import { buttonVariants } from "@/components/ui/button";

const ICONS: Record<string, typeof Crown> = {
  "correct-scores": Target,
};

export async function VipPackagesSection() {
  const plans = await getVipPlans();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">VIP Packages</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick a package and unlock proven, daily football predictions.</p>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const Icon = ICONS[plan.slug] ?? Crown;
          return (
            <Link
              key={plan.id}
              href={`/pricing?plan=${plan.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-accent text-brand">
                <Icon className="size-6" />
              </div>
              <h3 className="mt-4 font-bold">{plan.name}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{plan.description}</p>
              <span className={buttonVariants({ className: "mt-4 w-full" })}>
                View Package
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
