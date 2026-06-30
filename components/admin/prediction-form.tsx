"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPrediction, updatePrediction, type PredictionInput } from "@/lib/actions/admin/predictions";
import {
  searchFixturesForDate,
  getFixturePickOptions,
  type FixtureOption,
  type PickOption,
} from "@/lib/actions/admin/fixture-lookup";
import type { Tables } from "@/types/database";

const schema = z.object({
  plan_id: z.string().min(1, "Select a plan"),
  home_team: z.string().min(1, "Pick a fixture"),
  away_team: z.string().min(1, "Pick a fixture"),
  league: z.string().optional(),
  prediction_type: z.string().min(1, "Pick a market"),
  odds: z.string().optional(),
  confidence: z.string().optional(),
  kickoff_time: z.string().min(1),
  admin_notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function PredictionForm({
  plans,
  prediction,
  defaultPlanId,
}: {
  plans: Tables<"plans">[];
  prediction?: Tables<"predictions">;
  defaultPlanId?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [manualEntry, setManualEntry] = useState(!!prediction);

  const [matchDate, setMatchDate] = useState(
    prediction ? prediction.kickoff_time.slice(0, 10) : format(new Date(), "yyyy-MM-dd")
  );
  const [fixtureFilter, setFixtureFilter] = useState("");
  const [fixtures, setFixtures] = useState<FixtureOption[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(
    prediction?.external_fixture_id ? String(prediction.external_fixture_id) : ""
  );
  const [pickOptions, setPickOptions] = useState<PickOption[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(false);
  const [fixtureMeta, setFixtureMeta] = useState<{
    leagueId?: number;
    homeLogo?: string;
    awayLogo?: string;
  }>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: prediction
      ? {
          plan_id: prediction.plan_id,
          home_team: prediction.home_team,
          away_team: prediction.away_team,
          league: prediction.league ?? "",
          prediction_type: prediction.prediction_type,
          odds: prediction.odds?.toString() ?? "",
          confidence: prediction.confidence?.toString() ?? "",
          kickoff_time: prediction.kickoff_time.slice(0, 16),
          admin_notes: prediction.admin_notes ?? "",
        }
      : { plan_id: defaultPlanId ?? "" },
  });

  useEffect(() => {
    if (manualEntry) return;
    setLoadingFixtures(true);
    setFixtures([]);
    searchFixturesForDate(matchDate)
      .then(setFixtures)
      .catch(() => toast.error("Could not load fixtures for that date"))
      .finally(() => setLoadingFixtures(false));
  }, [matchDate, manualEntry]);

  const filteredFixtures = useMemo(() => {
    const q = fixtureFilter.trim().toLowerCase();
    if (!q) return fixtures;
    return fixtures.filter(
      (f) => f.homeTeam.toLowerCase().includes(q) || f.awayTeam.toLowerCase().includes(q) || f.league.toLowerCase().includes(q)
    );
  }, [fixtures, fixtureFilter]);

  const fixturesByLeague = useMemo(() => {
    const groups = new Map<string, FixtureOption[]>();
    for (const f of filteredFixtures) {
      if (!groups.has(f.league)) groups.set(f.league, []);
      groups.get(f.league)!.push(f);
    }
    return groups;
  }, [filteredFixtures]);

  function handleFixtureSelect(fixtureId: string) {
    setSelectedFixtureId(fixtureId);
    setValue("prediction_type", "");
    setValue("odds", "");
    setPickOptions([]);

    const fixture = fixtures.find((f) => String(f.fixtureId) === fixtureId);
    if (!fixture) return;

    setValue("home_team", fixture.homeTeam);
    setValue("away_team", fixture.awayTeam);
    setValue("league", fixture.league);
    setValue("kickoff_time", fixture.kickoffTime.slice(0, 16));
    setFixtureMeta({ leagueId: fixture.leagueId, homeLogo: fixture.homeLogo, awayLogo: fixture.awayLogo });

    setLoadingPicks(true);
    getFixturePickOptions(fixture.fixtureId)
      .then(setPickOptions)
      .catch(() => toast.error("Could not load markets for that fixture"))
      .finally(() => setLoadingPicks(false));
  }

  function handlePickSelect(predictionType: string) {
    setValue("prediction_type", predictionType);
    const option = pickOptions.find((p) => p.predictionType === predictionType);
    if (option?.odds) setValue("odds", String(option.odds));
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload: PredictionInput = {
        ...values,
        odds: values.odds ? Number(values.odds) : undefined,
        confidence: values.confidence ? Number(values.confidence) : undefined,
        kickoff_time: new Date(values.kickoff_time).toISOString(),
        ...(!manualEntry && selectedFixtureId
          ? {
              external_fixture_id: Number(selectedFixtureId),
              league_id: fixtureMeta.leagueId,
              home_team_logo: fixtureMeta.homeLogo,
              away_team_logo: fixtureMeta.awayLogo,
            }
          : {}),
      };
      if (prediction) await updatePrediction(prediction.id, payload);
      else await createPrediction(payload);
      toast.success(prediction ? "Prediction updated" : "Prediction added");
      router.push("/admin/predictions");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label>Plan</Label>
        <Select value={watch("plan_id")} onValueChange={(v) => setValue("plan_id", v ?? "")}>
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
        {errors.plan_id && <p className="text-sm text-destructive">{errors.plan_id.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <Label>{manualEntry ? "Manual entry" : "Find a fixture"}</Label>
        <button
          type="button"
          className="text-xs font-medium text-brand hover:underline"
          onClick={() => setManualEntry((v) => !v)}
        >
          {manualEntry ? "Search fixtures from API instead" : "Can't find the match? Enter manually"}
        </button>
      </div>

      {manualEntry ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Home Team</Label>
              <Input {...register("home_team")} />
            </div>
            <div className="space-y-2">
              <Label>Away Team</Label>
              <Input {...register("away_team")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>League</Label>
            <Input {...register("league")} />
          </div>
          <div className="space-y-2">
            <Label>Prediction / Scoreline</Label>
            <Input placeholder="Over 2.5, BTTS, Home Win, or 2-1" {...register("prediction_type")} />
            {errors.prediction_type && <p className="text-sm text-destructive">{errors.prediction_type.message}</p>}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Match Date</Label>
            <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Filter by team or league</Label>
            <Input
              placeholder="e.g. Arsenal, Premier League…"
              value={fixtureFilter}
              onChange={(e) => setFixtureFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Fixture</Label>
            <Select value={selectedFixtureId} onValueChange={(v) => v && handleFixtureSelect(v)}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={loadingFixtures ? "Loading fixtures…" : `${filteredFixtures.length} fixtures found`}
                />
              </SelectTrigger>
              <SelectContent>
                {Array.from(fixturesByLeague.entries()).map(([league, leagueFixtures]) => (
                  <SelectGroup key={league}>
                    <SelectLabel>{league}</SelectLabel>
                    {leagueFixtures.map((f) => (
                      <SelectItem key={f.fixtureId} value={String(f.fixtureId)}>
                        {f.homeTeam} vs {f.awayTeam} · {format(new Date(f.kickoffTime), "HH:mm")}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {(errors.home_team || errors.away_team) && (
              <p className="text-sm text-destructive">Select a fixture from the list.</p>
            )}
          </div>

          {selectedFixtureId && (
            <div className="rounded-lg bg-secondary/50 p-3 text-sm">
              <p className="font-medium">
                {watch("home_team")} vs {watch("away_team")}
              </p>
              <p className="text-muted-foreground">{watch("league")}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Pick</Label>
            <Select value={watch("prediction_type")} onValueChange={(v) => v && handlePickSelect(v)}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !selectedFixtureId
                      ? "Select a fixture first"
                      : loadingPicks
                        ? "Loading markets…"
                        : pickOptions.length === 0
                          ? "No odds available for this fixture"
                          : "Select a market"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {pickOptions.map((option) => (
                  <SelectItem key={option.label} value={option.predictionType}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.prediction_type && <p className="text-sm text-destructive">{errors.prediction_type.message}</p>}
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Odds (optional)</Label>
          <Input type="number" step="0.01" {...register("odds")} />
        </div>
        <div className="space-y-2">
          <Label>Confidence % (optional)</Label>
          <Input type="number" min={0} max={100} {...register("confidence")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Kickoff Time</Label>
        <Input type="datetime-local" {...register("kickoff_time")} />
      </div>
      <div className="space-y-2">
        <Label>Admin Notes (optional)</Label>
        <Textarea {...register("admin_notes")} />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : prediction ? "Update Prediction" : "Add Prediction"}
      </Button>
    </form>
  );
}
