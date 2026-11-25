"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MARKET_LABELS, isMarketKey } from "@/lib/predictions/markets";
import { formatKickoffTime, formatShortDate } from "@/lib/utils/date";
import { approveResults, deletePredictions, regradeFromScores, setPredictionResult, unapproveResults } from "@/lib/actions/client";
import type { Tables } from "@/types/database";

type Prediction = Tables<"predictions">;

const RESULT_CLASS: Record<Prediction["result"], string> = {
  win: "text-emerald-600",
  loss: "text-red-600",
  push: "text-amber-600",
  pending: "text-muted-foreground",
};

export function PredictionsTable({ predictions, mode = "all" }: { predictions: Prediction[]; mode?: "all" | "results" }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  // Only rows on the current page count: the selection survives client-side
  // paging, and bulk actions must never hit rows the admin can't see.
  const ids = useMemo(() => {
    const visible = new Set(predictions.map((p) => p.id));
    return [...selected].filter((id) => visible.has(id));
  }, [selected, predictions]);
  const allSelected = predictions.length > 0 && ids.length === predictions.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(label: string, fn: () => Promise<unknown>, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    startTransition(async () => {
      try {
        const result = await fn();
        const detail =
          result && typeof result === "object"
            ? Object.entries(result as Record<string, number>)
                .map(([k, v]) => `${v} ${k}`)
                .join(", ")
            : "";
        toast.success(detail ? `${label}: ${detail}` : label);
        setSelected(new Set());
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  }

  function quickResult(p: Prediction, result: Prediction["result"]) {
    run("Result saved", () => setPredictionResult(p.id, { result, home_score: p.home_score, away_score: p.away_score, approve: false }));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 text-sm">
        <span className="px-2 text-muted-foreground">{ids.length} selected</span>
        <Button size="sm" disabled={pending || ids.length === 0} onClick={() => run("Approved", () => approveResults(ids))}>
          Approve results
        </Button>
        <Button size="sm" variant="outline" disabled={pending || ids.length === 0} onClick={() => run("Re-graded", () => regradeFromScores(ids))}>
          Re-grade from score
        </Button>
        <Button size="sm" variant="outline" disabled={pending || ids.length === 0} onClick={() => run("Approval removed", () => unapproveResults(ids))}>
          Unapprove
        </Button>
        {mode === "all" && (
          <Button
            size="sm"
            variant="destructive"
            disabled={pending || ids.length === 0}
            onClick={() => run("Deleted", () => deletePredictions(ids), `Delete ${ids.length} prediction(s)? This removes them from the public record.`)}
          >
            Delete
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(predictions.map((p) => p.id)))}
                />
              </th>
              <th className="px-3 py-2">Kickoff (WAT)</th>
              <th className="px-3 py-2">Match</th>
              <th className="px-3 py-2">Pick</th>
              <th className="px-3 py-2">Odds</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2">Verified</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {predictions.map((p) => (
              <tr key={p.id} className={cn(selected.has(p.id) && "bg-brand/5")}>
                <td className="px-3 py-2">
                  <input type="checkbox" aria-label={`Select ${p.home_team} vs ${p.away_team}`} checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                  {formatShortDate(p.kickoff_time)} {formatKickoffTime(p.kickoff_time)}
                  <span className="block text-[11px]">{p.status.replace("_", " ")}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="font-medium">
                    {p.home_team} vs {p.away_team}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {p.league ?? "—"} · {p.source === "api_sync" ? "auto" : p.source}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {p.prediction_type}
                  <span className="block text-xs text-muted-foreground">{isMarketKey(p.market) ? MARKET_LABELS[p.market] : "Other market"}</span>
                  {p.original_prediction_type !== p.prediction_type && (
                    <span className="block text-[11px] text-amber-600">published as {p.original_prediction_type}</span>
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums">{p.odds ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">{p.home_score !== null && p.away_score !== null ? `${p.home_score}–${p.away_score}` : "—"}</td>
                <td className="px-3 py-2">
                  <select
                    aria-label="Result"
                    value={p.result}
                    disabled={pending}
                    onChange={(e) => quickResult(p, e.target.value as Prediction["result"])}
                    className={cn("rounded-md border border-input bg-background px-1.5 py-1 text-xs font-semibold", RESULT_CLASS[p.result])}
                  >
                    <option value="pending">Pending</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="push">Void</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  {p.result_approved ? (
                    <span className="text-xs font-semibold text-emerald-600">✓ Approved</span>
                  ) : p.result !== "pending" ? (
                    <Button size="xs" variant="outline" disabled={pending} onClick={() => run("Approved", () => approveResults([p.id]))}>
                      Approve
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Button variant="ghost" size="icon-sm" aria-label="Edit" render={<Link href={`/admin/predictions/${p.id}`} />}>
                    <Pencil className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {predictions.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No predictions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
