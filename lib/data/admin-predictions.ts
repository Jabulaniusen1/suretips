import { createClient } from "@/lib/supabase/server";

export interface AdminPredictionRow {
  id: string;
  plan_id: string;
  home_team: string;
  away_team: string;
  league: string | null;
  prediction_type: string;
  odds: number | null;
  confidence: number | null;
  kickoff_time: string;
  status: "not_started" | "live" | "finished";
  result: "win" | "loss" | "push" | "pending";
  plans: { name: string } | null;
}

export async function getAdminPredictions(planId?: string): Promise<AdminPredictionRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("predictions")
    .select("*, plans(name)")
    .order("kickoff_time", { ascending: false })
    .limit(100);

  if (planId) query = query.eq("plan_id", planId);

  const { data } = await query;
  return (data ?? []) as unknown as AdminPredictionRow[];
}
