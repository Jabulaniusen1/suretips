"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitFreeGamePrediction } from "@/lib/actions/free-games";
import type { Tables } from "@/types/database";

export function FreeGameCard({
  match,
  existingChoice,
}: {
  match: Tables<"predictions">;
  existingChoice?: "home" | "draw" | "away";
}) {
  const [choice, setChoice] = useState(existingChoice);
  const [submitting, setSubmitting] = useState(false);

  async function handlePick(value: "home" | "draw" | "away") {
    if (choice) return;
    setSubmitting(true);
    try {
      await submitFreeGamePrediction(match.id, value);
      setChoice(value);
      toast.success("Prediction locked in! Good luck.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const options: { value: "home" | "draw" | "away"; label: string }[] = [
    { value: "home", label: match.home_team },
    { value: "draw", label: "Draw" },
    { value: "away", label: match.away_team },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">Today&apos;s Free Pick</p>
      <h3 className="mt-1 text-lg font-bold">
        {match.home_team} vs {match.away_team}
      </h3>
      <p className="text-sm text-muted-foreground">{match.league}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={choice === option.value ? "default" : "outline"}
            disabled={!!choice || submitting}
            onClick={() => handlePick(option.value)}
            className="h-auto py-3 text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {choice && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          You picked <strong className="text-foreground">{options.find((o) => o.value === choice)?.label}</strong>. Come
          back tomorrow for a new pick!
        </p>
      )}
    </div>
  );
}
