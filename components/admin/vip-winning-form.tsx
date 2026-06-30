"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createVipWinning } from "@/lib/actions/admin/vip-wins";
import type { Tables } from "@/types/database";

export function VipWinningForm({ plans }: { plans: Tables<"plans">[] }) {
  const router = useRouter();
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [league, setLeague] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [predictionType, setPredictionType] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [result, setResult] = useState<Tables<"vip_winnings">["result"]>("win");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!planId || !homeTeam || !awayTeam || !predictionType) return toast.error("Fill in all required fields");
    setSubmitting(true);
    try {
      await createVipWinning({
        plan_id: planId,
        league: league || undefined,
        home_team: homeTeam,
        away_team: awayTeam,
        prediction_type: predictionType,
        home_score: homeScore ? Number(homeScore) : undefined,
        away_score: awayScore ? Number(awayScore) : undefined,
        result,
        date,
      });
      toast.success("VIP winning added");
      router.push("/admin/vip-wins");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Home Team</Label>
          <Input value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Away Team</Label>
          <Input value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>League</Label>
        <Input value={league} onChange={(e) => setLeague(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Pick</Label>
        <Input value={predictionType} onChange={(e) => setPredictionType(e.target.value)} placeholder="Over 2.5, BTTS, 2-1, etc." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Home Score (optional)</Label>
          <Input type="number" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Away Score (optional)</Label>
          <Input type="number" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Result</Label>
          <Select value={result} onValueChange={(v) => setResult((v ?? "win") as typeof result)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="win">Win</SelectItem>
              <SelectItem value="loss">Loss</SelectItem>
              <SelectItem value="push">Push</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Saving…" : "Add VIP Winning"}
      </Button>
    </div>
  );
}
