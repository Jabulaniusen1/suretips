import type { Tables } from "@/types/database";

// Maps a custom_pages.filter_id to a substring match against
// predictions.prediction_type. Keeps the SEO landing pages (and the
// homepage filter bar) data-driven without a dedicated category column.
const FILTER_KEYWORDS: Record<string, string[]> = {
  btts: ["btts", "both teams"],
  double_chance: ["double chance"],
  home_win: ["home win"],
  away_win: ["away win"],
  over_1_5: ["over 1.5"],
  over_2_5: ["over 2.5"],
};

export const FREE_PREDICTIONS_FILTERS = [
  { id: "free", label: "Free Tips" },
  { id: "all", label: "All Tips" },
  { id: "super_single", label: "Super Single" },
  { id: "double_chance", label: "Double Chance" },
  { id: "home_win", label: "Home Win" },
  { id: "away_win", label: "Away Win" },
  { id: "over_1_5", label: "1.5 Goals" },
  { id: "over_2_5", label: "2.5 Goals" },
  { id: "btts", label: "BTTS/GG" },
] as const;

export type FilterId = (typeof FREE_PREDICTIONS_FILTERS)[number]["id"];

export const FILTER_IDS = new Set<string>(FREE_PREDICTIONS_FILTERS.map((f) => f.id));

export const FILTER_PAGE_META: Record<FilterId, { title: string; subtitle: string; description: string }> = {
  free: {
    title: "Free Football Tips",
    subtitle: "Expert picks, updated daily — completely free.",
    description: "Hand-picked predictions across top leagues. No subscription needed.",
  },
  all: {
    title: "All Predictions Today",
    subtitle: "The full daily prediction feed across every market.",
    description: "Browse every tip published for today — from match winners to goals markets.",
  },
  super_single: {
    title: "Super Single Pick",
    subtitle: "Our highest-confidence bet of the day.",
    description: "One pick. Maximum value. Our top analysts single out the strongest play each day.",
  },
  double_chance: {
    title: "Double Chance Tips",
    subtitle: "Cover two outcomes in one safer bet.",
    description: "Double chance markets give you more ways to win — ideal for consistent returns.",
  },
  home_win: {
    title: "Home Win Predictions",
    subtitle: "Daily tips backing the home side.",
    description: "We identify fixtures where home advantage and form make a home win the smart play.",
  },
  away_win: {
    title: "Away Win Predictions",
    subtitle: "Value picks backing the visiting team.",
    description: "Away wins carry great value — our analysts pinpoint the best ones each day.",
  },
  over_1_5: {
    title: "Over 1.5 Goals Tips",
    subtitle: "Matches tipped to see at least 2 goals.",
    description: "Consistent and popular market — we find fixtures almost certain to produce goals.",
  },
  over_2_5: {
    title: "Over 2.5 Goals Tips",
    subtitle: "High-scoring games tipped to go over 2.5.",
    description: "Attack-heavy match-ups where three or more goals is the most likely outcome.",
  },
  btts: {
    title: "Both Teams to Score",
    subtitle: "Games where both sides are expected to net.",
    description: "BTTS tips across top leagues — the market where exciting, open games pay off.",
  },
};

export function applyPredictionFilter(
  predictions: Tables<"predictions">[],
  filterId: string
): Tables<"predictions">[] {
  if (filterId === "super_single") {
    const top = [...predictions].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];
    return top ? [top] : [];
  }

  const keywords = FILTER_KEYWORDS[filterId];
  if (!keywords) return predictions;

  return predictions.filter((p) => keywords.some((kw) => p.prediction_type.toLowerCase().includes(kw)));
}
