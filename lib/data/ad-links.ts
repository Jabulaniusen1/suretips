import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getActiveAdLinks(): Promise<Tables<"ad_links">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_links")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  return data ?? [];
}
