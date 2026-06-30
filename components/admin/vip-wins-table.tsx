"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/lib/utils/date";
import { deleteVipWinning } from "@/lib/actions/admin/vip-wins";

export interface VipWinRow {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  prediction_type: string;
  result: "win" | "loss" | "push";
  plans: { name: string } | null;
}

export function VipWinsTable({ entries }: { entries: VipWinRow[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    setBusyId(id);
    try {
      await deleteVipWinning(id);
      toast.success("Deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Plan</th>
            <th className="px-4 py-2">Match</th>
            <th className="px-4 py-2">Pick</th>
            <th className="px-4 py-2">Result</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-2 text-muted-foreground">{formatShortDate(entry.date)}</td>
              <td className="px-4 py-2">
                <Badge variant="secondary">{entry.plans?.name}</Badge>
              </td>
              <td className="px-4 py-2">
                {entry.home_team} vs {entry.away_team}
              </td>
              <td className="px-4 py-2">{entry.prediction_type}</td>
              <td className="px-4 py-2 capitalize">{entry.result}</td>
              <td className="px-4 py-2">
                <Button variant="ghost" size="icon-sm" disabled={busyId === entry.id} onClick={() => handleDelete(entry.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                No entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
