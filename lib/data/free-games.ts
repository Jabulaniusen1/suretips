import { createClient } from "@/lib/supabase/server";
import { getDateRange } from "@/lib/utils/date";
import { PLAN_SLUGS } from "@/lib/constants";
import type { Tables } from "@/types/database";

export async function getTodaysFeaturedMatch(): Promise<Tables<"predictions"> | null> {
  const supabase = await createClient();
  const { data: plan } = await supabase.from("plans").select("id").eq("slug", PLAN_SLUGS.FREE_GAMES).maybeSingle();
  if (!plan) return null;

  const range = getDateRange("today");
  const { data } = await supabase
    .from("predictions")
    .select("*")
    .eq("plan_id", plan.id)
    .gte("kickoff_time", range.from)
    .lte("kickoff_time", range.to)
    .order("confidence", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getUserEntryForToday(userId: string): Promise<Tables<"free_games_entries"> | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("free_games_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("game_date", today)
    .maybeSingle();
  return data;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  total_points: number;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("free_games_entries").select("user_id, points_earned, users(full_name)");

  const totals = new Map<string, LeaderboardEntry>();
  for (const row of (data ?? []) as unknown as Array<{ user_id: string; points_earned: number; users: { full_name: string | null } | null }>) {
    if (!totals.has(row.user_id)) {
      totals.set(row.user_id, { user_id: row.user_id, full_name: row.users?.full_name ?? null, total_points: 0 });
    }
    totals.get(row.user_id)!.total_points += row.points_earned;
  }

  return Array.from(totals.values())
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 20);
}
