import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { MARKET_PAGES, type MarketPage } from "@/lib/seo/market-pages";
import type { MarketKey } from "@/lib/predictions/markets";
import { CONTENT_ROW_KEY, applyMarketText, createSiteText, type SiteText, type StoredContent } from "@/lib/content/registry";

/** Admin-edited site text (one query per request; defaults if it fails). */
export const getSiteText = cache(async (): Promise<SiteText> => {
  const { data, error } = await createPublicClient().from("site_config").select("value").eq("key", CONTENT_ROW_KEY).maybeSingle();
  if (error) console.error(`[site-text] ${error.message}`);
  return createSiteText((data?.value ?? null) as StoredContent | null);
});

export interface MarketPagesWithText {
  pages: MarketPage[];
  bySlug(slug: string): MarketPage | undefined;
  /** Market page that lists a given market (most specific first). */
  forMarket(market: MarketKey): MarketPage | undefined;
}

/** Built-in market pages with their admin-edited labels, headings and copy. */
export const getMarketPagesWithText = cache(async (): Promise<MarketPagesWithText> => {
  const text = await getSiteText();
  const pages = MARKET_PAGES.map((p) => applyMarketText(p, text));
  const bySlug = new Map(pages.map((p) => [p.slug, p]));
  return {
    pages,
    bySlug: (slug) => bySlug.get(slug),
    forMarket: (market) =>
      pages.find((p) => p.selection.kind === "markets" && p.selection.markets.length === 1 && p.selection.markets[0] === market) ??
      pages.find((p) => p.selection.kind === "markets" && p.selection.markets.includes(market)),
  };
});
