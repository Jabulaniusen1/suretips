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
import { createPrediction, updatePrediction } from "@/lib/actions/client";
import { type PredictionInput } from "@/lib/actions/admin/predictions";
import { searchFixturesForDate, getFixturePickOptions } from "@/lib/actions/client";
import { type FixtureOption, type PickOption } from "@/lib/actions/admin/fixture-lookup";
import { lagosDateKey } from "@/lib/utils/date";
import { ACTIVE_MARKET_KEYS, MARKET_LABELS, classifyMarket, isMarketEnabled } from "@/lib/predictions/markets";
import type { Tables } from "@/types/database";

const schema = z.object({
  home_team: z.string().min(1, "Pick a fixture or enter the home team"),
  away_team: z.string().min(1, "Pick a fixture or enter the away team"),
  league: z.string().optional(),
  prediction_type: z.string().min(1, "Enter or pick a market"),
  market: z.string().optional(),
  odds: z.string().optional(),
  confidence: z.string().optional(),
  kickoff_time: z.string().min(1, "Kickoff time is required"),
  status: z.enum(["not_started", "live", "finished"]),
  home_score: z.string().optional(),
  away_score: z.string().optional(),
  analysis: z.string().max(1500).optional(),
  admin_notes: z.string().max(1500).optional(),
});

type FormValues = z.infer<typeof schema>;

/** ISO instant -> value for <input type="datetime-local"> in the browser's own time zone. */
function toLocalInput(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

const numberOrNull = (value?: string) => (value && value.trim() !== "" ? Number(value) : null);

export function PredictionForm({ prediction }: { prediction?: Tables<"predictions"> }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [manualEntry, setManualEntry] = useState(!!prediction);

  // Match days are Lagos calendar days (the API search uses Africa/Lagos).
  const [matchDate, setMatchDate] = useState(lagosDateKey(prediction ? new Date(prediction.kickoff_time) : new Date()));
  const [fixtureFilter, setFixtureFilter] = useState("");
  const [fixtures, setFixtures] = useState<FixtureOption[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(prediction?.external_fixture_id ? String(prediction.external_fixture_id) : "");
  const [pickOptions, setPickOptions] = useState<PickOption[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(false);
  const [fixtureMeta, setFixtureMeta] = useState<{ leagueId?: number | null; homeLogo?: string | null; awayLogo?: string | null }>({
    leagueId: prediction?.league_id,
    homeLogo: prediction?.home_team_logo,
    awayLogo: prediction?.away_team_logo,
  });

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
          home_team: prediction.home_team,
          away_team: prediction.away_team,
          league: prediction.league ?? "",
          prediction_type: prediction.prediction_type,
          market: prediction.market ?? "auto",
          odds: prediction.odds?.toString() ?? "",
          confidence: prediction.confidence?.toString() ?? "",
          kickoff_time: toLocalInput(prediction.kickoff_time),
          status: prediction.status,
          home_score: prediction.home_score?.toString() ?? "",
          away_score: prediction.away_score?.toString() ?? "",
          analysis: prediction.analysis ?? "",
          admin_notes: prediction.admin_notes ?? "",
        }
      : { market: "auto", status: "not_started" },
  });

  const pickText = watch("prediction_type") ?? "";
  const detectedMarket = classifyMarket(pickText);

  useEffect(() => {
    if (manualEntry) return;
    setLoadingFixtures(true);
    setFixtures([]);
    searchFixturesForDate(matchDate)
      .then(setFixtures)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load fixtures for that date"))
      .finally(() => setLoadingFixtures(false));
  }, [matchDate, manualEntry]);

  const filteredFixtures = useMemo(() => {
    const q = fixtureFilter.trim().toLowerCase();
    if (!q) return fixtures;
    return fixtures.filter((f) => f.homeTeam.toLowerCase().includes(q) || f.awayTeam.toLowerCase().includes(q) || f.league.toLowerCase().includes(q));
  }, [fixtures, fixtureFilter]);

  const fixturesByLeague = useMemo(() => {
    const groups = new Map<string, FixtureOption[]>();
    for (const f of filteredFixtures) groups.set(f.league, [...(groups.get(f.league) ?? []), f]);
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
    setValue("kickoff_time", toLocalInput(fixture.kickoffTime));
    setFixtureMeta({ leagueId: fixture.leagueId, homeLogo: fixture.homeLogo, awayLogo: fixture.awayLogo });

    setLoadingPicks(true);
    getFixturePickOptions(fixture.fixtureId)
      .then(setPickOptions)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load markets for that fixture"))
      .finally(() => setLoadingPicks(false));
  }

  function handlePickSelect(predictionType: string) {
    setValue("prediction_type", predictionType);
    const option = pickOptions.find((p) => p.predictionType === predictionType);
    if (option?.odds) {
      setValue("odds", String(option.odds));
      setValue("confidence", String(Math.round(100 / option.odds)));
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload: PredictionInput = {
        home_team: values.home_team,
        away_team: values.away_team,
        league: values.league,
        prediction_type: values.prediction_type,
        market: values.market && values.market !== "auto" ? (values.market as PredictionInput["market"]) : null,
        odds: numberOrNull(values.odds),
        confidence: numberOrNull(values.confidence),
        kickoff_time: new Date(values.kickoff_time).toISOString(),
        status: values.status,
        home_score: numberOrNull(values.home_score),
        away_score: numberOrNull(values.away_score),
        analysis: values.analysis,
        admin_notes: values.admin_notes,
        external_fixture_id: selectedFixtureId ? Number(selectedFixtureId) : null,
        league_id: fixtureMeta.leagueId ?? null,
        home_team_logo: fixtureMeta.homeLogo ?? "",
        away_team_logo: fixtureMeta.awayLogo ?? "",
      };
      if (prediction) await updatePrediction(prediction.id, payload);
      else await createPrediction(payload);
      toast.success(prediction ? "Prediction updated" : "Prediction added");
      router.push("/admin/predictions");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const kickedOff = prediction ? new Date(prediction.kickoff_time).getTime() <= Date.now() || prediction.status !== "not_started" : false;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      {kickedOff && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          This match has kicked off. The published pick (<strong>{prediction?.original_prediction_type}</strong>
          {prediction?.original_odds ? ` @ ${prediction.original_odds}` : ""}) is frozen and will keep showing on the results record,
          even if you edit the pick below.
        </p>
      )}

      <div className="flex items-center justify-between">
        <Label>{manualEntry ? "Manual entry" : "Find a fixture"}</Label>
        <button type="button" className="text-xs font-medium text-brand hover:underline" onClick={() => {
            // A fixture picked in search mode must not stick to a manually typed match.
            if (!manualEntry && !prediction) {
              setSelectedFixtureId("");
              setFixtureMeta({});
            }
            setManualEntry(!manualEntry);
          }}>
          {manualEntry ? "Search fixtures from API instead" : "Can't find the match? Enter manually"}
        </button>
      </div>

      {manualEntry ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home_team">Home team</Label>
              <Input id="home_team" {...register("home_team")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="away_team">Away team</Label>
              <Input id="away_team" {...register("away_team")} />
            </div>
          </div>
          {(errors.home_team || errors.away_team) && <p className="text-sm text-destructive">{errors.home_team?.message ?? errors.away_team?.message}</p>}
          <div className="space-y-2">
            <Label htmlFor="league">Competition</Label>
            <Input id="league" {...register("league")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prediction_type">Pick</Label>
            <Input id="prediction_type" placeholder="Over 2.5 Goals, BTTS Yes, Home Win, Double Chance 1X or 2-1" {...register("prediction_type")} />
            {errors.prediction_type && <p className="text-sm text-destructive">{errors.prediction_type.message}</p>}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="match-date">Match date</Label>
              <Input id="match-date" type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fixture-filter">Filter</Label>
              <Input id="fixture-filter" placeholder="Team or league" value={fixtureFilter} onChange={(e) => setFixtureFilter(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fixture</Label>
            <Select value={selectedFixtureId} onValueChange={(v) => v && handleFixtureSelect(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingFixtures ? "Loading fixtures…" : `${filteredFixtures.length} fixtures found`} />
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
            {(errors.home_team || errors.away_team) && <p className="text-sm text-destructive">Select a fixture from the list.</p>}
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
            <Select value={pickText} onValueChange={(v) => v && handlePickSelect(v)}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !selectedFixtureId ? "Select a fixture first" : loadingPicks ? "Loading markets…" : pickOptions.length === 0 ? "No odds available for this fixture" : "Select a market"
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

      <div className="space-y-2">
        <Label>Market</Label>
        <Select value={watch("market") ?? "auto"} onValueChange={(v) => setValue("market", v ?? "auto")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Detect automatically{detectedMarket ? ` (${MARKET_LABELS[detectedMarket]})` : " (not recognised)"}</SelectItem>
            {/* DISABLED (correct score): only active markets can be chosen. */}
            {ACTIVE_MARKET_KEYS.map((m) => (
              <SelectItem key={m} value={m}>
                {MARKET_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Picks without a recognised market are published but don&apos;t appear on market pages and can&apos;t be auto-graded.</p>
        {detectedMarket && !isMarketEnabled(detectedMarket) && (watch("market") ?? "auto") === "auto" && (
          <p className="text-xs font-medium text-destructive">{MARKET_LABELS[detectedMarket]} predictions are switched off for now.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="odds">Decimal odds</Label>
          <Input id="odds" type="number" step="0.01" min="1.01" {...register("odds")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confidence">Confidence %</Label>
          <Input id="confidence" type="number" min={0} max={100} {...register("confidence")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="kickoff_time">Kickoff (your local time)</Label>
        <Input id="kickoff_time" type="datetime-local" {...register("kickoff_time")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={watch("status")} onValueChange={(v) => v && setValue("status", v as FormValues["status"])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not started</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="finished">Finished</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="home_score">Home score</Label>
          <Input id="home_score" type="number" min={0} {...register("home_score")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="away_score">Away score</Label>
          <Input id="away_score" type="number" min={0} {...register("away_score")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="analysis">Analysis (public)</Label>
        <Textarea id="analysis" rows={4} placeholder="Why this pick? Shown on the match page." {...register("analysis")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin_notes">Admin notes (private)</Label>
        <Textarea id="admin_notes" rows={2} {...register("admin_notes")} />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : prediction ? "Update prediction" : "Add prediction"}
      </Button>
    </form>
  );
}
