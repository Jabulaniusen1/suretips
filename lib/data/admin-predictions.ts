import "server-only";
import { createClient } from "@/lib/supabase/server";
import { addDaysToKey, lagosDateKey, lagosDayRange, parseDateKey } from "@/lib/utils/date";
import { isMarketKey } from "@/lib/predictions/markets";
import type { Tables } from "@/types/database";

export type AdminPrediction = Tables<"predictions">;

export interface AdminPredictionFilters {
  range?: string;
  date?: string;
  status?: string;
  result?: string;
  market?: string;
  source?: string;
  q?: string;
  page?: string;
}

export const ADMIN_PAGE_SIZE = 100;

export async function getAdminPredictions(filters: AdminPredictionFilters): Promise<{ rows: AdminPrediction[]; total: number; page: number }> {
  const supabase = await createClient();
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);

  let query = supabase.from("predictions").select("*", { count: "exact" });

  const today = lagosDateKey();
  const dateKey = parseDateKey(filters.date) ?? (filters.range === "today" ? today : filters.range === "tomorrow" ? addDaysToKey(today, 1) : filters.range === "yesterday" ? addDaysToKey(today, -1) : null);
  if (dateKey) {
    const { from, to } = lagosDayRange(dateKey);
    query = query.gte("kickoff_time", from).lte("kickoff_time", to).order("kickoff_time", { ascending: true });
  } else {
    query = query.order("kickoff_time", { ascending: false });
  }

  if (filters.status === "not_started" || filters.status === "live" || filters.status === "finished") query = query.eq("status", filters.status);
  if (filters.result === "win" || filters.result === "loss" || filters.result === "push" || filters.result === "pending") query = query.eq("result", filters.result);
  if (filters.result === "unapproved") query = query.eq("result_approved", false).neq("result", "pending");
  if (isMarketKey(filters.market)) query = query.eq("market", filters.market);
  if (filters.market === "other") query = query.is("market", null);
  if (filters.source === "manual" || filters.source === "api_sync" || filters.source === "live_fallback") query = query.eq("source", filters.source);
  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, " ").trim().slice(0, 60);
    if (term) query = query.or(`home_team.ilike.%${term}%,away_team.ilike.%${term}%,league.ilike.%${term}%`);
  }

  const { data, count, error } = await query.range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return { rows: data ?? [], total: count ?? 0, page };
}

/** Results queue: graded-but-unapproved, or ungraded well after kickoff. */
export async function getResultsQueue(view: "awaiting" | "ungraded"): Promise<AdminPrediction[]> {
  const supabase = await createClient();
  let query = supabase.from("predictions").select("*").order("kickoff_time", { ascending: false }).limit(300);
  query =
    view === "awaiting"
      ? query.eq("result_approved", false).neq("result", "pending")
      : query.eq("result", "pending").lte("kickoff_time", new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString());
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
