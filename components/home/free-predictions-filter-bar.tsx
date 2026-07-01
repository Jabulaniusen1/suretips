import Link from "next/link";
import { cn } from "@/lib/utils";
import { FREE_PREDICTIONS_FILTERS } from "@/lib/utils/prediction-filter";

export function FreePredictionsFilterBar({ active }: { active: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {FREE_PREDICTIONS_FILTERS.map((filter) => (
        <Link
          key={filter.id}
          href={`/tips/${filter.id}`}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            active === filter.id
              ? "border-brand bg-brand text-brand-foreground"
              : "border-border text-muted-foreground hover:border-brand/50 hover:text-foreground"
          )}
        >
          {filter.label}
        </Link>
      ))}
    </div>
  );
}
