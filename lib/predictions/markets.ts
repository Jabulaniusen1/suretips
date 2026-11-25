// Single source of truth for betting markets.
//
// `classifyMarket` must stay in sync with the SQL function
// public.classify_prediction_market (supabase/migrations/20261125120000_initial_schema.sql),
// which maintains predictions.market in the database.

export const MARKET_KEYS = [
  "home_win",
  "away_win",
  "draw",
  "double_chance",
  "double_chance_12",
  "btts",
  "btts_no",
  "over_0_5",
  "over_1_5",
  "over_2_5",
  "over_3_5",
  "under_2_5",
  "under_3_5",
  "correct_score",
] as const;

export type MarketKey = (typeof MARKET_KEYS)[number];

export const MARKET_LABELS: Record<MarketKey, string> = {
  home_win: "Home Win",
  away_win: "Away Win",
  draw: "Draw",
  double_chance: "Double Chance",
  double_chance_12: "Double Chance 12",
  btts: "BTTS (GG)",
  btts_no: "BTTS No (NG)",
  over_0_5: "Over 0.5 Goals",
  over_1_5: "Over 1.5 Goals",
  over_2_5: "Over 2.5 Goals",
  over_3_5: "Over 3.5 Goals",
  under_2_5: "Under 2.5 Goals",
  under_3_5: "Under 3.5 Goals",
  correct_score: "Correct Score",
};

export function isMarketKey(value: unknown): value is MarketKey {
  return typeof value === "string" && (MARKET_KEYS as readonly string[]).includes(value);
}

// DISABLED (correct score): correct score predictions are switched off for now.
// The key stays in MARKET_KEYS so existing rows, the database check constraint
// and result grading keep working, but the market is hidden from every public
// page, menu and list, and admins can't publish new ones. To bring it back,
// empty this set and search the codebase for "DISABLED (correct score)".
export const DISABLED_MARKETS: ReadonlySet<MarketKey> = new Set<MarketKey>(["correct_score"]);

/** Markets currently offered on the site (menus, filters, admin pickers). */
export const ACTIVE_MARKET_KEYS: readonly MarketKey[] = MARKET_KEYS.filter((m) => !DISABLED_MARKETS.has(m));

export function isMarketEnabled(market: MarketKey | null | undefined): boolean {
  return !market || !DISABLED_MARKETS.has(market);
}

/**
 * PostgREST filter that drops predictions in disabled markets (null markets --
 * bespoke picks -- are kept). Use with `.or(...)` on public prediction queries.
 */
export const ENABLED_MARKETS_FILTER =
  DISABLED_MARKETS.size > 0 ? `market.is.null,market.not.in.(${[...DISABLED_MARKETS].join(",")})` : null;

const OVER_LINES: Record<string, MarketKey> = {
  "0.5": "over_0_5",
  "1.5": "over_1_5",
  "2.5": "over_2_5",
  "3.5": "over_3_5",
};

const UNDER_LINES: Record<string, MarketKey> = {
  "2.5": "under_2_5",
  "3.5": "under_3_5",
};

/**
 * Picks that combine selections ("Home Win & Over 1.5"), cover part of a match
 * ("First Half Over 0.5", "HT/FT") or count something other than goals
 * ("Over 9.5 Corners") are bespoke: they mention a market but don't settle
 * like it, so they must not be listed under it or auto-graded as it.
 */
const BESPOKE_PICK_RE = /&|\+|\band\b|half|\b(?:ht|ft|fh|sh|1h|2h)\b|corner|card|booking|shot|foul|offside|throw|penalt|handicap|clean sheet|to nil|team total/;

/** The whole pick is a match goal line: "Over 2.5", "Over 2.5 Goals", "Total Under 3.5". */
export const GOAL_LINE_RE = /^(?:(?:total|match)\s+)?(?:goals\s+)?(over|under)\s*(\d+(?:\.\d+)?)(?:\s*goals?)?$/;

/**
 * Maps a free-text pick ("Over 2.5 Goals", "BTTS No", "1X", "2-1") to a
 * market. Returns null for picks that don't belong to a supported market
 * (e.g. "Over 4.5", handicaps, combined or half-time picks) -- those are still
 * valid predictions, they just don't appear on market landing pages and are
 * graded by hand.
 */
export function classifyMarket(predictionType: string): MarketKey | null {
  const t = predictionType.trim().toLowerCase();

  if (/^\d+\s*[-:]\s*\d+$/.test(t)) return "correct_score";
  if (BESPOKE_PICK_RE.test(t)) return null;
  if (t === "home win" || t === "home" || t === "1") return "home_win";
  if (t === "away win" || t === "away" || t === "2") return "away_win";
  if (t === "draw" || t === "x") return "draw";
  if (t === "12" || t === "no draw" || t.includes("double chance 12") || t.includes("home/away")) {
    return "double_chance_12";
  }
  if (t === "1x" || t === "x2" || t.includes("double chance")) return "double_chance";

  const isBtts = /(btts|both teams)/.test(t);
  if (t === "ng" || t === "nogg" || (isBtts && /\b(no|not)\b/.test(t))) return "btts_no";
  if (t === "gg" || isBtts) return "btts";

  const line = GOAL_LINE_RE.exec(t);
  if (line) return (line[1] === "over" ? OVER_LINES[line[2]] : UNDER_LINES[line[2]]) ?? null;

  return null;
}

/** Prefer the stored market; fall back to classifying the pick text. */
export function marketOf(prediction: { market?: string | null; prediction_type: string }): MarketKey | null {
  if (isMarketKey(prediction.market)) return prediction.market;
  return classifyMarket(prediction.prediction_type);
}

/** Drops predictions in disabled markets (see DISABLED_MARKETS). */
export function withoutDisabledMarkets<T extends { market?: string | null; prediction_type: string }>(predictions: T[]): T[] {
  return DISABLED_MARKETS.size > 0 ? predictions.filter((p) => isMarketEnabled(marketOf(p))) : predictions;
}
