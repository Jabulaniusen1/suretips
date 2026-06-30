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
