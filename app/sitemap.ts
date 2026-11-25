import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { MARKET_PAGES, applyMarketSelection, isMarketPageSlug } from "@/lib/seo/market-pages";
import { isCustomPageIndexable } from "@/lib/data/custom-pages";

// Regenerated at most hourly. Lists only canonical, indexable, public URLs.
// lastModified always comes from a real content change -- never "now".
export const revalidate = 3600;

/** When the copy of each static page last changed. Update when editing it. */
const STATIC_PAGES: Array<{ path: string; updated: string }> = [
  { path: "/about", updated: "2026-11-23" },
  { path: "/methodology", updated: "2026-11-23" },
  { path: "/editorial-standards", updated: "2026-11-19" },
  { path: "/responsible-betting", updated: "2026-11-19" },
  { path: "/contact", updated: "2026-11-19" },
  { path: "/faq", updated: "2026-11-19" },
  { path: "/terms", updated: "2026-11-19" },
  { path: "/privacy", updated: "2026-11-19" },
  { path: "/disclaimer", updated: "2026-11-19" },
  { path: "/cookies", updated: "2026-11-19" },
];

/** Hubs whose content is the prediction feed; fallback lastmod if the DB is unreachable. */
const FEED_FALLBACK = "2026-11-19";

const DAY_MS = 24 * 60 * 60 * 1000;
const MATCH_LOOKBACK_DAYS = 60;

function maxDate(dates: Array<string | null | undefined>): string | undefined {
  let max: number | undefined;
  for (const d of dates) {
    if (!d) continue;
    const t = new Date(d).getTime();
    if (!Number.isNaN(t) && (max === undefined || t > max)) max = t;
  }
  return max === undefined ? undefined : new Date(max).toISOString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const url = (path: string) => `${origin}${path === "/" ? "" : path}`;
  const supabase = createPublicClient();
  const now = Date.now();

  const [recent, settled, posts, competitions, pages, matches] = await Promise.all([
    // Predictions touched around today drive the feed pages' lastmod.
    supabase
      .from("predictions")
      .select("id, prediction_type, market, odds, confidence, kickoff_time, external_fixture_id, home_team, away_team, league_id, updated_at")
      .gte("kickoff_time", new Date(now - 2 * DAY_MS).toISOString())
      .lte("kickoff_time", new Date(now + 3 * DAY_MS).toISOString())
      .order("updated_at", { ascending: false })
      .limit(1000),
    supabase
      .from("predictions")
      .select("result_approved_at")
      .eq("result_approved", true)
      .order("result_approved_at", { ascending: false, nullsFirst: false })
      .limit(1),
    supabase.from("blog_posts").select("slug, updated_at, published_at").eq("published", true).lte("published_at", new Date(now).toISOString()),
    supabase.from("competitions").select("slug, league_id, updated_at").eq("status", "active"),
    supabase.from("custom_pages").select("*").eq("is_published", true),
    supabase.rpc("sitemap_match_pages", {
      p_since: new Date(now - MATCH_LOOKBACK_DAYS * DAY_MS).toISOString(),
      p_until: new Date(now + 3 * DAY_MS).toISOString(),
    }),
  ]);

  for (const [label, res] of Object.entries({ recent, settled, posts, competitions, pages, matches })) {
    if (res.error) console.error(`[sitemap] ${label}: ${res.error.message}`);
  }

  const recentRows = recent.data ?? [];
  const feedUpdated = maxDate(recentRows.map((r) => r.updated_at)) ?? FEED_FALLBACK;

  const entries: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: feedUpdated, changeFrequency: "hourly", priority: 1 },
    { url: url("/tips"), lastModified: feedUpdated, changeFrequency: "daily", priority: 0.9 },
    { url: url("/predictions"), lastModified: feedUpdated, changeFrequency: "daily", priority: 0.8 },
    {
      url: url("/previous-results"),
      lastModified: settled.data?.[0]?.result_approved_at ?? FEED_FALLBACK,
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: url("/competitions"), lastModified: maxDate((competitions.data ?? []).map((c) => c.updated_at)) ?? FEED_FALLBACK, changeFrequency: "weekly", priority: 0.7 },
    { url: url("/blog"), lastModified: maxDate((posts.data ?? []).map((p) => p.updated_at)) ?? FEED_FALLBACK, changeFrequency: "weekly", priority: 0.7 },
  ];

  // Market landing pages: lastmod = latest change to a prediction they list.
  const overrides = new Map((pages.data ?? []).filter((p) => isMarketPageSlug(p.slug)).map((p) => [p.slug, p]));
  for (const page of MARKET_PAGES) {
    const override = overrides.get(page.slug);
    if (override?.noindex) continue;
    const listed = applyMarketSelection(recentRows, page.selection);
    entries.push({
      url: url(`/tips/${page.slug}`),
      lastModified: maxDate([...listed.map((r) => r.updated_at), override?.updated_at]) ?? feedUpdated,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  // Admin SEO pages that pass the indexability rules.
  for (const page of (pages.data ?? []).filter(isCustomPageIndexable)) {
    entries.push({ url: url(`/tips/${page.slug}`), lastModified: page.updated_at, changeFrequency: "weekly", priority: 0.6 });
  }

  for (const comp of competitions.data ?? []) {
    const leagueUpdated = comp.league_id ? maxDate(recentRows.filter((r) => r.league_id === comp.league_id).map((r) => r.updated_at)) : undefined;
    entries.push({
      url: url(`/competitions/${comp.slug}`),
      lastModified: maxDate([comp.updated_at, leagueUpdated]),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  for (const post of posts.data ?? []) {
    entries.push({ url: url(`/blog/${post.slug}`), lastModified: maxDate([post.updated_at, post.published_at]), changeFrequency: "monthly", priority: 0.6 });
  }

  // Match pages that carry at least one prediction (others are noindex).
  for (const match of matches.data ?? []) {
    entries.push({ url: url(`/match/${match.external_fixture_id}`), lastModified: match.last_modified, changeFrequency: "daily", priority: 0.5 });
  }

  for (const page of STATIC_PAGES) {
    entries.push({ url: url(page.path), lastModified: page.updated, changeFrequency: "yearly", priority: 0.3 });
  }

  return entries;
}
