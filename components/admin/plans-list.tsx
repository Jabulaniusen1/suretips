"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { togglePlanActive } from "@/lib/actions/admin/plans";
import type { Tables } from "@/types/database";

export function PlansList({ plans }: { plans: Tables<"plans">[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggle(id: string, value: boolean) {
    setBusyId(id);
    try {
      await togglePlanActive(id, value);
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
            <th className="px-4 py-2">Plan</th>
            <th className="px-4 py-2">Two-step</th>
            <th className="px-4 py-2">Daily Limit</th>
            <th className="px-4 py-2">Active</th>
            <th className="px-4 py-2">Manage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {plans.map((plan) => (
            <tr key={plan.id}>
              <td className="px-4 py-2 font-medium">{plan.name}</td>
              <td className="px-4 py-2">{plan.requires_activation ? "Yes" : "No"}</td>
              <td className="px-4 py-2">{plan.max_predictions_per_day ?? "—"}</td>
              <td className="px-4 py-2">
                <Switch
                  checked={plan.is_active}
                  disabled={busyId === plan.id}
                  onCheckedChange={(v) => handleToggle(plan.id, v)}
                />
              </td>
              <td className="px-4 py-2">
                <Button variant="outline" size="sm" render={<Link href={`/admin/plans/${plan.id}`} />}>
                  Manage
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
