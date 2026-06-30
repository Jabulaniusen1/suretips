import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

const STYLES: Record<Tables<"vip_winnings">["result"], string> = {
  win: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  loss: "bg-red-500/15 text-red-600 dark:text-red-400",
  push: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

const LABEL: Record<Tables<"vip_winnings">["result"], string> = {
  win: "Win",
  loss: "Loss",
  push: "Push",
};

export function ResultBadge({ result }: { result: Tables<"vip_winnings">["result"] }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", STYLES[result])}>
      {LABEL[result]}
    </span>
  );
}
