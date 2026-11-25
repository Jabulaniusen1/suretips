"use client";

import { lagosDateKey } from "@/lib/utils/date";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { syncPredictionsFromApi } from "@/lib/actions/client";

export function SyncPredictionsForm({ leagues }: { leagues: Array<{ id: number; name: string }> }) {
  const [leagueId, setLeagueId] = useState<string>("");
  // Fixtures are grouped by Lagos calendar day, not UTC.
  const [date, setDate] = useState(() => lagosDateKey());
  const [minOdds, setMinOdds] = useState(1.3);
  const [maxOdds, setMaxOdds] = useState(2.5);
  const [maxCount, setMaxCount] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  async function handleSync() {
    setSubmitting(true);
    try {
      const result = await syncPredictionsFromApi({
        leagueId: leagueId ? Number(leagueId) : undefined,
        date,
        minOdds,
        maxOdds,
        maxCount,
      });

      if (result.inserted > 0) {
        toast.success(
          `Published ${result.inserted} predictions from ${result.scanned} fixtures scanned` +
            (result.skipped > 0 ? ` (${result.skipped} already synced, skipped).` : ".")
        );
      } else if (result.skipped > 0 && result.checked === 0) {
        toast.info(`All ${result.skipped} matching fixtures for this date are already have a match-result pick.`);
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
        Backs the favourite of each fixture on a date (optionally one competition) when its price is inside your odds range.
        Picks are published immediately with confidence set to the implied probability. Fixtures that already have a
        match-result pick are skipped.
      </p>
      <div className="space-y-2">
        <Label>League (optional)</Label>
        <Select value={leagueId} onValueChange={(v) => setLeagueId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All leagues" />
          </SelectTrigger>
          <SelectContent>
            {leagues.map((league) => (
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
      <div className="space-y-2">
        <Label>Max predictions</Label>
        <Input type="number" min={1} max={50} value={maxCount} onChange={(e) => setMaxCount(Number(e.target.value))} />
      </div>
      <Button onClick={handleSync} disabled={submitting}>
        {submitting ? "Syncing…" : "Sync Predictions"}
      </Button>
    </div>
  );
}
