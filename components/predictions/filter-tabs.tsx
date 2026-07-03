import Link from "next/link";
import { cn } from "@/lib/utils";
import { FREE_PREDICTIONS_FILTERS } from "@/lib/utils/prediction-filter";

export function FilterTabs({
  active,
  variant = "light",
}: {
  active: string;
  variant?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-fit max-w-full flex-wrap justify-center gap-1.5 overflow-x-auto rounded-2xl border p-1.5",
        variant === "dark" ? "border-white/10 bg-white/5" : "border-border bg-muted/50"
      )}
    >
      {FREE_PREDICTIONS_FILTERS.map((filter) => (
        <Link
          key={filter.id}
          href={`/tips/${filter.id}`}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === filter.id
              ? "bg-brand text-brand-foreground"
              : variant === "dark"
                ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
          )}
        >
          {filter.label}
        </Link>
      ))}
    </div>
  );
}
