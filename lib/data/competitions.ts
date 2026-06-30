import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getActiveCompetitions(): Promise<Tables<"competitions">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("competitions")
    .select("*")
    .eq("status", "active")
    .order("display_order");
  return data ?? [];
}

export async function getCompetitionBySlug(slug: string): Promise<Tables<"competitions"> | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("competitions").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  return data;
}
