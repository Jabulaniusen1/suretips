"use server";

import { toActionResult } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";
import { MARKET_KEYS, MARKET_LABELS, classifyMarket, isMarketEnabled } from "@/lib/predictions/markets";
import { gradePrediction } from "@/lib/utils/prediction-grading";
import { autoSyncFreeTips } from "@/lib/predictions/auto-sync-free-tips";
import { updateScores } from "@/lib/predictions/update-scores";
import { addDaysToKey, lagosDateKey } from "@/lib/utils/date";
import type { Database } from "@/types/database";

type PredictionUpdate = Database["public"]["Tables"]["predictions"]["Update"];

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const optionalUrl = z
  .string()
  .trim()
  .url()
  .startsWith("https://")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));
const score = z.number().int().min(0).max(99).nullable().optional();

const predictionSchema = z.object({
  home_team: z.string().trim().min(1, "Home team is required").max(100),
  away_team: z.string().trim().min(1, "Away team is required").max(100),
  league: optionalText(100),
  league_id: z.number().int().positive().nullable().optional(),
  external_fixture_id: z.number().int().positive().nullable().optional(),
  home_team_logo: optionalUrl,
  away_team_logo: optionalUrl,
  prediction_type: z.string().trim().min(1, "Pick is required").max(60),
  /** null = classify automatically from the pick text */
  market: z.enum(MARKET_KEYS).nullable().optional(),
  odds: z.number().min(1.01).max(1000).nullable().optional(),
  confidence: z.number().int().min(0).max(100).nullable().optional(),
  kickoff_time: z.string().datetime({ offset: true }),
  analysis: optionalText(1500),
  admin_notes: optionalText(1500),
  status: z.enum(["not_started", "live", "finished"]).optional(),
  home_score: score,
  away_score: score,
});

export type PredictionInput = z.input<typeof predictionSchema>;

const idsSchema = z.array(z.string().uuid()).min(1).max(500);

async function authorize() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");
  return createClient();
}

function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; "));
  return parsed.data;
}

function revalidatePublic() {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

function friendlyDbError(message: string): string {
  if (message.includes("predictions_fixture_market_key")) return "This fixture already has a prediction in that market.";
  if (message.includes("predictions_result_approved_check")) return "A pending result can't be approved.";
  return message;
}

/**
 * "Detect automatically" (null) is resolved here rather than left to the DB
 * trigger: on UPDATE the trigger treats an explicit null as the admin's choice
 * and would clear the stored market.
 */
function resolveMarket(data: z.output<typeof predictionSchema>) {
  const market = data.market ?? classifyMarket(data.prediction_type);
  // DISABLED (correct score): switched-off markets can't be published.
  if (market && !isMarketEnabled(market)) {
    throw new Error(`${MARKET_LABELS[market]} predictions are switched off for now.`);
  }
  return market;
}

async function createPredictionImpl(input: PredictionInput) {
  const supabase = await authorize();
  const data = parse(predictionSchema, input);
  const market = resolveMarket(data);

  const { error } = await supabase.from("predictions").insert({ ...data, market, source: "manual" });
  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePublic();
}

async function updatePredictionImpl(id: string, input: PredictionInput) {
  const supabase = await authorize();
  parse(z.string().uuid(), id);
  const data = parse(predictionSchema, input);
  const market = resolveMarket(data);

  const { error } = await supabase.from("predictions").update({ ...data, market }).eq("id", id);
  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePublic();
}

const resultSchema = z.object({
  result: z.enum(["win", "loss", "push", "pending"]),
  home_score: score,
  away_score: score,
  approve: z.boolean().optional(),
});

/** Set (or correct) a result by hand. Approving is optional and explicit. */
async function setPredictionResultImpl(id: string, input: z.input<typeof resultSchema>) {
  const supabase = await authorize();
  parse(z.string().uuid(), id);
  const data = parse(resultSchema, input);

  const update: PredictionUpdate = { result: data.result };
  if (data.home_score !== undefined) update.home_score = data.home_score;
  if (data.away_score !== undefined) update.away_score = data.away_score;
  if (data.result !== "pending") update.status = "finished";
  update.result_approved = data.result !== "pending" && Boolean(data.approve);

  const { error } = await supabase.from("predictions").update(update).eq("id", id);
  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePublic();
}

/** Approve graded results so they count in public statistics. */
async function approveResultsImpl(ids: string[]) {
  const supabase = await authorize();
  const list = parse(idsSchema, ids);

  const { data, error } = await supabase
    .from("predictions")
    .update({ result_approved: true })
    .in("id", list)
    .neq("result", "pending")
    .select("id");
  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePublic();
  return { approved: data?.length ?? 0, skipped: list.length - (data?.length ?? 0) };
}

async function unapproveResultsImpl(ids: string[]) {
  const supabase = await authorize();
  const list = parse(idsSchema, ids);
  const { error } = await supabase.from("predictions").update({ result_approved: false }).in("id", list);
  if (error) throw new Error(error.message);
  revalidatePublic();
}

/** Re-grade from the stored score -- e.g. after correcting a score by hand. */
async function regradeFromScoresImpl(ids: string[]) {
  const supabase = await authorize();
  const list = parse(idsSchema, ids);

  const { data: rows, error } = await supabase
    .from("predictions")
    .select("id, prediction_type, original_prediction_type, home_score, away_score, result_approved")
    .in("id", list);
  if (error) throw new Error(error.message);

  let graded = 0;
  let skipped = 0;
  for (const row of rows ?? []) {
    if (row.result_approved || row.home_score === null || row.away_score === null) {
      skipped += 1;
      continue;
    }
    // Grade the pick as published (frozen at kickoff) -- that's what the public record shows.
    const result = gradePrediction(row.original_prediction_type || row.prediction_type, row.home_score, row.away_score);
    if (!result) {
      skipped += 1;
      continue;
    }
    const { error: updateError } = await supabase.from("predictions").update({ result, status: "finished" }).eq("id", row.id);
    if (updateError) throw new Error(updateError.message);
    graded += 1;
  }
  revalidatePublic();
  return { graded, skipped };
}

async function deletePredictionsImpl(ids: string[]) {
  const supabase = await authorize();
  const list = parse(idsSchema, ids);
  const { error } = await supabase.from("predictions").delete().in("id", list);
  if (error) throw new Error(error.message);
  revalidatePublic();
}

/** Admin-triggered run of the same job the cron executes. */
async function runAutoSyncNowImpl() {
  await authorize();
  const today = lagosDateKey();
  const results = [];
  for (const day of [today, addDaysToKey(today, 1), addDaysToKey(today, 2)]) results.push(await autoSyncFreeTips(day));
  revalidatePublic();
  return results;
}

async function runScoreUpdateNowImpl() {
  await authorize();
  const result = await updateScores();
  revalidatePublic();
  return result;
}

// Exported actions return { ok, data | error } -- see lib/actions/result.ts.
export async function createPrediction(...args: Parameters<typeof createPredictionImpl>) {
  return toActionResult(() => createPredictionImpl(...args));
}
export async function updatePrediction(...args: Parameters<typeof updatePredictionImpl>) {
  return toActionResult(() => updatePredictionImpl(...args));
}
export async function setPredictionResult(...args: Parameters<typeof setPredictionResultImpl>) {
  return toActionResult(() => setPredictionResultImpl(...args));
}
export async function approveResults(...args: Parameters<typeof approveResultsImpl>) {
  return toActionResult(() => approveResultsImpl(...args));
}
export async function unapproveResults(...args: Parameters<typeof unapproveResultsImpl>) {
  return toActionResult(() => unapproveResultsImpl(...args));
}
export async function regradeFromScores(...args: Parameters<typeof regradeFromScoresImpl>) {
  return toActionResult(() => regradeFromScoresImpl(...args));
}
export async function deletePredictions(...args: Parameters<typeof deletePredictionsImpl>) {
  return toActionResult(() => deletePredictionsImpl(...args));
}
export async function runAutoSyncNow(...args: Parameters<typeof runAutoSyncNowImpl>) {
  return toActionResult(() => runAutoSyncNowImpl(...args));
}
export async function runScoreUpdateNow(...args: Parameters<typeof runScoreUpdateNowImpl>) {
  return toActionResult(() => runScoreUpdateNowImpl(...args));
}
