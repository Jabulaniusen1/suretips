import { subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getLatestWinningsDate(planId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vip_winnings")
    .select("date")
    .eq("plan_id", planId)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.date ?? null;
}

export async function getWinningsForDate(planId: string, date: string): Promise<Tables<"vip_winnings">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vip_winnings")
    .select("*")
    .eq("plan_id", planId)
    .eq("date", date)
    .order("created_at");

  return data ?? [];
}

export async function getAdjacentWinningsDates(planId: string, date: string) {
  const supabase = await createClient();
  const [{ data: previous }, { data: next }] = await Promise.all([
    supabase
      .from("vip_winnings")
      .select("date")
      .eq("plan_id", planId)
      .lt("date", date)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("vip_winnings")
      .select("date")
      .eq("plan_id", planId)
      .gt("date", date)
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return { previousDate: previous?.date ?? null, nextDate: next?.date ?? null };
}

export async function getWinningsStats(planId: string, trailingDays = 30) {
  const supabase = await createClient();
  const since = subDays(new Date(), trailingDays).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("vip_winnings")
    .select("result, date")
    .eq("plan_id", planId)
    .gte("date", since)
    .order("date", { ascending: false });

  const rows = data ?? [];
  const totalPicks = rows.length;
  const wins = rows.filter((r) => r.result === "win").length;
  const decided = rows.filter((r) => r.result !== "push").length;
  const successRate = decided > 0 ? Math.round((wins / decided) * 100) : 0;

  let winStreak = 0;
  for (const row of rows) {
    if (row.result === "push") continue;
    if (row.result === "win") winStreak += 1;
    else break;
  }

  return { successRate, totalPicks, winStreak };
}

export async function getOverallWinningsStats(trailingDays = 30) {
  const supabase = await createClient();
  const since = subDays(new Date(), trailingDays).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("vip_winnings")
    .select("result, date")
    .gte("date", since)
    .order("date", { ascending: false });

  const rows = data ?? [];
  const totalPicks = rows.length;
  const wins = rows.filter((r) => r.result === "win").length;
  const decided = rows.filter((r) => r.result !== "push").length;
  const successRate = decided > 0 ? Math.round((wins / decided) * 100) : 0;

  let winStreak = 0;
  for (const row of rows) {
    if (row.result === "push") continue;
    if (row.result === "win") winStreak += 1;
    else break;
  }

  return { successRate, totalPicks, winStreak };
}

export interface GroupedWinnings {
  plan: Tables<"plans">;
  entries: Tables<"vip_winnings">[];
}

export async function getHomepageWinnings(beforeDate?: string): Promise<{
  groups: GroupedWinnings[];
  oldestDate: string | null;
}> {
  const supabase = await createClient();

  let dateQuery = supabase.from("vip_winnings").select("date").order("date", { ascending: false });
  if (beforeDate) dateQuery = dateQuery.lt("date", beforeDate);

  const { data: dateRows } = await dateQuery.limit(1);
  const targetDate = dateRows?.[0]?.date;
  if (!targetDate) return { groups: [], oldestDate: null };

  const { data: entries } = await supabase
    .from("vip_winnings")
    .select("*, plans!inner(*)")
    .eq("date", targetDate)
    .order("created_at");

  const groupsMap = new Map<string, GroupedWinnings>();
  for (const row of entries ?? []) {
    const plan = (row as unknown as { plans: Tables<"plans"> }).plans;
    if (!groupsMap.has(plan.id)) groupsMap.set(plan.id, { plan, entries: [] });
    groupsMap.get(plan.id)!.entries.push(row as Tables<"vip_winnings">);
  }

  return { groups: Array.from(groupsMap.values()), oldestDate: targetDate };
}
