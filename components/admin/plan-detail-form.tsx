"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updatePlan } from "@/lib/actions/admin/plans";
import type { Tables } from "@/types/database";

export function PlanDetailForm({ plan }: { plan: Tables<"plans"> }) {
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");
  const [benefits, setBenefits] = useState(plan.benefits.join("\n"));
  const [isActive, setIsActive] = useState(plan.is_active);
  const [requiresActivation, setRequiresActivation] = useState(plan.requires_activation);
  const [maxPerDay, setMaxPerDay] = useState(plan.max_predictions_per_day?.toString() ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    try {
      await updatePlan(plan.id, {
        name,
        description,
        benefits: benefits.split("\n").map((b) => b.trim()).filter(Boolean),
        is_active: isActive,
        requires_activation: requiresActivation,
        max_predictions_per_day: maxPerDay ? Number(maxPerDay) : null,
      });
      toast.success("Plan updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Benefits (one per line)</Label>
        <Textarea rows={4} value={benefits} onChange={(e) => setBenefits(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Max Predictions Per Day</Label>
        <Input type="number" value={maxPerDay} onChange={(e) => setMaxPerDay(e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Requires Activation Fee (two-step unlock)</Label>
        <Switch checked={requiresActivation} onCheckedChange={setRequiresActivation} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Active / Visible</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <Button onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : "Save Plan"}
      </Button>
    </div>
  );
}
