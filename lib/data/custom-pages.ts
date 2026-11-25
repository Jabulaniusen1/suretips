import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { RESERVED_TIPS_SLUGS, isMarketPageSlug, type MarketPageOverride } from "@/lib/seo/market-pages";
export { isCustomPageIndexable, customPageContentLength } from "@/lib/seo/custom-page-rules";
import type { Tables } from "@/types/database";

export const getPublishedCustomPages = cache(async (): Promise<Tables<"custom_pages">[]> => {
  const { data, error } = await createPublicClient()
    .from("custom_pages")
    .select("*")
    .eq("is_published", true)
    .order("footer_order");
  if (error) console.error(`[custom-pages] list: ${error.message}`);
  return (data ?? []).filter((p) => !RESERVED_TIPS_SLUGS.has(p.slug));
});

export const getCustomPageBySlug = cache(async (slug: string): Promise<Tables<"custom_pages"> | null> => {
  if (!/^[a-z0-9-]{1,80}$/.test(slug) || RESERVED_TIPS_SLUGS.has(slug)) return null;
  const { data, error } = await createPublicClient()
    .from("custom_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`Could not load page ${slug}: ${error.message}`);
  return data;
});

/**
 * Admin override for a built-in market page. Errors fall back to the built-in
 * copy (null) rather than failing the page.
 */
export const getMarketPageOverride = cache(async (slug: string): Promise<MarketPageOverride | null> => {
  if (!isMarketPageSlug(slug)) return null;
  const { data, error } = await createPublicClient()
    .from("custom_pages")
    .select("meta_title, meta_description, meta_keywords, heading, introduction, main_content, faq, og_image, noindex, updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) {
    console.error(`[custom-pages] override ${slug}: ${error.message}`);
    return null;
  }
  return data;
});
