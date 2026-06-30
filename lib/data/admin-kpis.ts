import { subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";

export async function getAdminKpis() {
  const supabase = await createClient();
  const now = new Date();
  const last7d = subDays(now, 7).toISOString();
  const last30d = subDays(now, 30).toISOString();
  const last24h = subDays(now, 1).toISOString();

  const [
    { count: activeSubscribers },
    { data: revenueToday },
    { data: revenue7d },
    { data: revenue30d },
    { count: pendingActivations },
    { count: newSignups24h },
    { count: newSignups7d },
    { data: recentTransactions },
  ] = await Promise.all([
    supabase.from("user_subscriptions").select("id", { count: "exact", head: true }).eq("plan_status", "active"),
    supabase
      .from("transactions")
      .select("amount")
      .eq("status", "completed")
      .gte("created_at", new Date().toISOString().slice(0, 10)),
    supabase.from("transactions").select("amount").eq("status", "completed").gte("created_at", last7d),
    supabase.from("transactions").select("amount").eq("status", "completed").gte("created_at", last30d),
    supabase
      .from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("plan_status", "active")
      .eq("activation_fee_paid", false),
    supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", last24h),
    supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", last7d),
    supabase
      .from("transactions")
      .select("*, users(full_name, email), plans(name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const sum = (rows: { amount: number }[] | null) => (rows ?? []).reduce((acc, r) => acc + r.amount, 0);

  return {
    activeSubscribers: activeSubscribers ?? 0,
    revenueToday: sum(revenueToday),
    revenue7d: sum(revenue7d),
    revenue30d: sum(revenue30d),
    pendingActivations: pendingActivations ?? 0,
    newSignups24h: newSignups24h ?? 0,
    newSignups7d: newSignups7d ?? 0,
    recentTransactions: recentTransactions ?? [],
  };
}
