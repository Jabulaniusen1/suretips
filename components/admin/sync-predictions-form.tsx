"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { syncPredictionsFromApi } from "@/lib/actions/admin/sync-predictions";
import type { Tables } from "@/types/database";

// Domestic leagues run roughly Aug-May -- they'll correctly return zero
// fixtures (and zero predictions synced) outside that window. World Cup is
// listed first since it's the one major competition that runs in summer.
const LEAGUES = [
  { id: 1, name: "World Cup" },
  { id: 39, name: "Premier League" },
  { id: 140, name: "La Liga" },
  { id: 135, name: "Serie A" },
  { id: 78, name: "Bundesliga" },
  { id: 61, name: "Ligue 1" },
];

export function SyncPredictionsForm({ plans }: { plans: Tables<"plans">[] }) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [leagueId, setLeagueId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [minOdds, setMinOdds] = useState(1.3);
  const [maxOdds, setMaxOdds] = useState(2.5);
  const [defaultConfidence, setDefaultConfidence] = useState(65);
  const [maxCount, setMaxCount] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  async function handleSync() {
    if (!planId) return toast.error("Select a plan");
    setSubmitting(true);
    try {
      const result = await syncPredictionsFromApi({
        planId,
        leagueId: leagueId ? Number(leagueId) : undefined,
        date,
        minOdds,
        maxOdds,
        defaultConfidence,
        maxCount,
      });

      if (result.inserted > 0) {
        toast.success(
          `Inserted ${result.inserted} draft predictions from ${result.scanned} fixtures scanned` +
            (result.skipped > 0 ? ` (${result.skipped} already synced, skipped).` : ".")
        );
      } else if (result.skipped > 0 && result.checked === 0) {
        toast.info(`All ${result.skipped} matching fixtures for this date are already synced to this plan.`);
      } else if (result.scanned === 0) {
        toast.error(
          leagueId
            ? "No fixtures found for that league on this date — it may be off-season. Try a different date or league."
            : "No fixtures found for this date."
        );
      } else if (result.withOdds === 0) {
        toast.error(`Checked ${result.checked} of ${result.scanned} fixtures — none had bookmaker odds yet. Try a different date.`);
      } else {
        toast.error(
          `Checked ${result.checked} fixtures (${result.withOdds} had odds), but none had a favorite between ${minOdds} and ${maxOdds}. Try widening the odds range.`
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Pulls fixtures and bookmaker odds from API-Sports for the selected date/league, picks the favorite per
        match within your odds range, and inserts draft predictions. Always review before they go live — this
        requires <code>API_FOOTBALL_KEY</code> to be configured.
      </p>
      <div className="space-y-2">
        <Label>Plan</Label>
        <Select value={planId} onValueChange={(v) => setPlanId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>League (optional)</Label>
        <Select value={leagueId} onValueChange={(v) => setLeagueId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All leagues" />
          </SelectTrigger>
          <SelectContent>
            {LEAGUES.map((league) => (
              <SelectItem key={league.id} value={String(league.id)}>
                {league.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Min Odds</Label>
          <Input type="number" step="0.1" value={minOdds} onChange={(e) => setMinOdds(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Max Odds</Label>
          <Input type="number" step="0.1" value={maxOdds} onChange={(e) => setMaxOdds(Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Default Confidence %</Label>
          <Input type="number" value={defaultConfidence} onChange={(e) => setDefaultConfidence(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Max Predictions</Label>
          <Input type="number" value={maxCount} onChange={(e) => setMaxCount(Number(e.target.value))} />
        </div>
      </div>
      <Button onClick={handleSync} disabled={submitting}>
        {submitting ? "Syncing…" : "Sync Predictions"}
      </Button>
    </div>
  );
}
