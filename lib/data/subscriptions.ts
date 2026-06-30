import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getUserSubscriptions(userId: string): Promise<Map<string, Tables<"user_subscriptions">>> {
  const supabase = await createClient();
  const { data } = await supabase.from("user_subscriptions").select("*").eq("user_id", userId);
  return new Map((data ?? []).map((sub) => [sub.plan_id, sub]));
}

export async function getUserSubscriptionForPlan(
  userId: string,
  planId: string
): Promise<Tables<"user_subscriptions"> | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .maybeSingle();
  return data;
}
