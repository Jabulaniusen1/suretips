import { createClient } from "@/lib/supabase/server";
import { LOCKED_PREVIEW_ROW_LIMIT } from "@/lib/constants";
import type { Tables } from "@/types/database";

export async function getPredictionsForPlan(
  planId: string,
  range: { from: string; to: string },
  options: { unlocked: boolean }
): Promise<Tables<"predictions">[]> {
  const supabase = await createClient();

  let query = supabase
    .from("predictions")
    .select("*")
    .eq("plan_id", planId)
    .gte("kickoff_time", range.from)
    .lte("kickoff_time", range.to)
    .order("kickoff_time");

  // Server-side enforcement of the paywall: a locked plan never gets more
  // than the preview row limit back from the database, regardless of what
  // the UI overlay shows.
  if (!options.unlocked) {
    query = query.limit(LOCKED_PREVIEW_ROW_LIMIT);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getPredictionById(id: string): Promise<Tables<"predictions"> | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("predictions").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getFreePredictions(range: { from: string; to: string }): Promise<Tables<"predictions">[]> {
  const supabase = await createClient();
  const { data: freePlan } = await supabase.from("plans").select("id").eq("slug", "free-games").maybeSingle();
  if (!freePlan) return [];

  const { data } = await supabase
    .from("predictions")
    .select("*")
    .eq("plan_id", freePlan.id)
    .gte("kickoff_time", range.from)
    .lte("kickoff_time", range.to)
    .order("kickoff_time");

  return data ?? [];
}
