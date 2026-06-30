import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { getPredictionById } from "@/lib/data/predictions";
import { getPlanById } from "@/lib/data/plans";
import { getFixtureById, getH2H } from "@/lib/football-api";
import { cn } from "@/lib/utils";
import { ConfidenceRing } from "@/components/predictions/confidence-ring";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL = { not_started: "Not Started", live: "Live", finished: "Finished" } as const;

const RESULT_STYLES = {
  win: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  loss: "bg-red-500/15 text-red-600 dark:text-red-400",
  push: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  pending: "bg-secondary text-secondary-foreground",
} as const;

const RESULT_LABEL = { win: "Win", loss: "Loss", push: "Push", pending: "Pending" } as const;

function TeamCrest({ logo, name }: { logo: string | null; name: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {logo ? (
        <Image src={logo} alt={name} width={56} height={56} className="size-14 object-contain" />
      ) : (
        <span className="flex size-14 items-center justify-center rounded-full bg-secondary">
          <Shield className="size-7 text-muted-foreground/50" />
        </span>
      )}
      <p className="max-w-[9rem] text-sm font-semibold">{name}</p>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const prediction = await getPredictionById(id);
  if (!prediction) return {};
  return { title: `${prediction.home_team} vs ${prediction.away_team} Prediction` };
}

export default async function PredictionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prediction = await getPredictionById(id);
  if (!prediction) notFound();

  const [plan, fixture] = await Promise.all([
    getPlanById(prediction.plan_id),
    prediction.external_fixture_id ? getFixtureById(prediction.external_fixture_id) : Promise.resolve(null),
  ]);

  const h2h = fixture ? await getH2H(fixture.teams.home.id, fixture.teams.away.id) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {plan && (
        <Link href={`/dashboard/vip/${plan.slug}`} className="text-sm text-brand hover:underline">
          ← Back to {plan.name}
        </Link>
      )}

      <div className="mt-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{prediction.league ?? "Football"}</span>
          <span>{format(new Date(prediction.kickoff_time), "EEEE, d MMM yyyy 'at' HH:mm")}</span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 sm:gap-12">
          <TeamCrest logo={prediction.home_team_logo} name={prediction.home_team} />
          <div className="text-center">
            {prediction.home_score !== null && prediction.away_score !== null ? (
              <p className="text-3xl font-extrabold">
                {prediction.home_score} - {prediction.away_score}
              </p>
            ) : (
              <p className="text-xl font-bold text-muted-foreground">vs</p>
            )}
            <Badge
              variant={prediction.status === "live" ? "default" : "secondary"}
              className={cn("mt-2", prediction.status === "live" && "bg-brand text-brand-foreground")}
            >
              {STATUS_LABEL[prediction.status]}
            </Badge>
          </div>
          <TeamCrest logo={prediction.away_team_logo} name={prediction.away_team} />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 rounded-xl bg-secondary/50 p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Our Pick</p>
            <p className="text-sm font-semibold">{prediction.prediction_type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Odds</p>
            <p className="text-sm font-semibold">{prediction.odds ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Confidence</p>
            <ConfidenceRing value={prediction.confidence} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Result</p>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", RESULT_STYLES[prediction.result])}>
              {RESULT_LABEL[prediction.result]}
            </span>
          </div>
        </div>

        {prediction.admin_notes && (
          <p className="mt-4 text-sm text-muted-foreground">{prediction.admin_notes}</p>
        )}
      </div>

      {fixture && (
        <section className="mt-8">
          <h2 className="font-bold">Head to Head</h2>
          <div className="mt-3 space-y-2">
            {h2h.slice(0, 5).map((match) => (
              <div key={match.fixture.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                <span>
                  {match.teams.home.name} {match.goals.home ?? "-"} : {match.goals.away ?? "-"} {match.teams.away.name}
                </span>
                <span className="text-muted-foreground">{format(new Date(match.fixture.date), "d MMM yyyy")}</span>
              </div>
            ))}
            {h2h.length === 0 && <p className="text-sm text-muted-foreground">No previous meetings on record.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
