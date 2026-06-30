"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatShortDate } from "@/lib/utils/date";
import { deletePrediction, updatePredictionResult } from "@/lib/actions/admin/predictions";
import type { AdminPredictionRow } from "@/lib/data/admin-predictions";
import type { Tables } from "@/types/database";

export function PredictionsTable({ predictions }: { predictions: AdminPredictionRow[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this prediction?")) return;
    setBusyId(id);
    try {
      await deletePrediction(id);
      toast.success("Deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  async function handleResultChange(id: string, result: Tables<"predictions">["result"]) {
    setBusyId(id);
    try {
      await updatePredictionResult(id, result);
      toast.success("Result updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <th className="px-4 py-2">Kickoff</th>
            <th className="px-4 py-2">Plan</th>
            <th className="px-4 py-2">Match</th>
            <th className="px-4 py-2">Pick</th>
            <th className="px-4 py-2">Odds</th>
            <th className="px-4 py-2">Result</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {predictions.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{formatShortDate(p.kickoff_time)}</td>
              <td className="px-4 py-2">
                <Badge variant="secondary">{p.plans?.name}</Badge>
              </td>
              <td className="px-4 py-2">
                {p.home_team} vs {p.away_team}
              </td>
              <td className="px-4 py-2">{p.prediction_type}</td>
              <td className="px-4 py-2">{p.odds ?? "—"}</td>
              <td className="px-4 py-2">
                <Select
                  value={p.result}
                  onValueChange={(v) => handleResultChange(p.id, v as Tables<"predictions">["result"])}
                  disabled={busyId === p.id}
                >
                  <SelectTrigger size="sm" className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" render={<Link href={`/admin/predictions/${p.id}`} />}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" disabled={busyId === p.id} onClick={() => handleDelete(p.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {predictions.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                No predictions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
