import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/types/database";

export const getActiveAdLinks = cache(async (): Promise<Tables<"ad_links">[]> => {
  const { data, error } = await createPublicClient()
    .from("ad_links")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  if (error) console.error(`[ad-links] ${error.message}`);
  // Only well-formed http(s) links are rendered.
  return (data ?? []).filter((link) => /^https?:\/\//i.test(link.url));
});
