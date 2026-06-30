"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";
import type { Tables } from "@/types/database";

export type PredictionInput = {
  plan_id: string;
  home_team: string;
  away_team: string;
  league?: string;
  league_id?: number;
  external_fixture_id?: number;
  home_team_logo?: string;
  away_team_logo?: string;
  prediction_type: string;
  odds?: number;
  confidence?: number;
  kickoff_time: string;
  admin_notes?: string;
};

export async function createPrediction(input: PredictionInput) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("predictions").insert(input);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/predictions");
}

export async function updatePrediction(id: string, input: Partial<PredictionInput>) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("predictions").update(input).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/predictions");
}

export async function updatePredictionResult(
  id: string,
  result: Tables<"predictions">["result"],
  homeScore?: number,
  awayScore?: number
) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase
    .from("predictions")
    .update({ result, status: "finished", home_score: homeScore, away_score: awayScore })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/predictions");
}

export async function deletePrediction(id: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("predictions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/predictions");
}
