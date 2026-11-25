import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/types/database";

export const getActiveCompetitions = cache(async (): Promise<Tables<"competitions">[]> => {
  const { data, error } = await createPublicClient()
    .from("competitions")
    .select("*")
    .eq("status", "active")
    .order("display_order");
  if (error) console.error(`[competitions] list: ${error.message}`);
  return data ?? [];
});

export const getCompetitionBySlug = cache(async (slug: string): Promise<Tables<"competitions"> | null> => {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const { data, error } = await createPublicClient()
    .from("competitions")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(`Could not load competition ${slug}: ${error.message}`);
  return data;
});

/** Map of API-Sports league id -> competition hub, for internal links. */
export const getCompetitionsByLeagueId = cache(async (): Promise<Map<number, Tables<"competitions">>> => {
  const competitions = await getActiveCompetitions();
  return new Map(competitions.filter((c) => c.league_id).map((c) => [c.league_id as number, c]));
});
