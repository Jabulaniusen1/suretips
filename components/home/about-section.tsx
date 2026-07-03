import { ShieldCheck, TrendingUp, Users } from "lucide-react";

const POINTS = [
  {
    icon: ShieldCheck,
    title: "Transparency",
    description: "Every result we publish — win or loss — stays on the record. Check our full history any time.",
  },
  {
    icon: TrendingUp,
    title: "Accuracy",
    description: "Predictions are built from data and expert analysis, not guesswork or recycled tips.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Thousands of bettors rely on Kingpredicts daily for safer, smarter football picks.",
  },
];

export function AboutSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-ink p-8 text-ink-foreground sm:p-12">
        <h2 className="text-2xl font-bold">Built on Proof, Not Promises</h2>
        <p className="mt-3 max-w-2xl text-zinc-300">
          One principle drives everything at Kingpredicts: show your work. Every prediction and every
          result — wins included, losses included — stays on the record, so you can judge our form
          yourself before you ever pay for a tip.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {POINTS.map((point) => (
            <div key={point.title}>
              <point.icon className="size-6 text-brand" />
              <h3 className="mt-3 font-bold">{point.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
