import { createClient } from "@/lib/supabase/server";
import { VIP_PLAN_SLUGS } from "@/lib/constants";
import type { Tables } from "@/types/database";

export async function getActivePlans(): Promise<Tables<"plans">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  return data ?? [];
}

export async function getVipPlans(): Promise<Tables<"plans">[]> {
  const plans = await getActivePlans();
  return plans.filter((p) => (VIP_PLAN_SLUGS as readonly string[]).includes(p.slug));
}

export async function getPlanBySlug(slug: string): Promise<Tables<"plans"> | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function getPlanById(id: string): Promise<Tables<"plans"> | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").eq("id", id).maybeSingle();
  return data;
}
