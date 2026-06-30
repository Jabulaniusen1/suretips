import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getPlanPrices(planId: string): Promise<Tables<"plan_prices">[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("plan_prices").select("*").eq("plan_id", planId);
  return data ?? [];
}

export { resolvePrice } from "@/lib/utils/resolve-price";
