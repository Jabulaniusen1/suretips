import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfidenceRing } from "@/components/predictions/confidence-ring";
import type { Tables } from "@/types/database";

const STATUS_LABEL: Record<Tables<"predictions">["status"], string> = {
  not_started: "Not Started",
  live: "Live",
  finished: "Finished",
};

function TeamBadge({ logo }: { logo: string | null }) {
  if (logo) {
    return <Image src={logo} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" />;
  }
  return <Shield className="size-5 shrink-0 text-muted-foreground/40" />;
}

export function PredictionList({ predictions, emptyLabel = "No games scheduled for this date." }: {
  predictions: Tables<"predictions">[];
  emptyLabel?: string;
}) {
  if (predictions.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="divide-y divide-border">
      {predictions.map((prediction) => (
        <Link
          key={prediction.id}
          href={`/predictions/${prediction.id}`}
          className="flex items-center gap-4 py-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <TeamBadge logo={prediction.home_team_logo} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {prediction.home_team} <span className="text-muted-foreground">vs</span> {prediction.away_team}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {prediction.league ?? "Football"} · {format(new Date(prediction.kickoff_time), "d MMM, HH:mm")}
              </p>
            </div>
            <TeamBadge logo={prediction.away_team_logo} />
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{prediction.prediction_type}</p>
            {prediction.odds && <p className="text-xs text-muted-foreground">Odds {prediction.odds}</p>}
          </div>
          <ConfidenceRing value={prediction.confidence} />
          <div className="flex flex-col items-end gap-1">
            {prediction.status !== "not_started" && prediction.home_score !== null && prediction.away_score !== null && (
              <p className="text-sm font-bold tabular-nums">
                {prediction.home_score}-{prediction.away_score}
              </p>
            )}
            <Badge
              variant={prediction.status === "live" ? "default" : "secondary"}
              className={prediction.status === "live" ? "bg-brand text-brand-foreground" : ""}
            >
              {STATUS_LABEL[prediction.status]}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
