export const PLAN_SLUGS = {
  DAILY_2_ODDS: "daily-2-odds-combo",
  DAILY_5_ODDS: "daily-5-odds-combo",
  DAILY_50_ODDS: "daily-50-odds-combo",
  CORRECT_SCORES: "correct-scores",
} as const;

export const VIP_PLAN_SLUGS = [
  PLAN_SLUGS.DAILY_2_ODDS,
  PLAN_SLUGS.DAILY_5_ODDS,
  PLAN_SLUGS.DAILY_50_ODDS,
  PLAN_SLUGS.CORRECT_SCORES,
] as const;

export const LOCKED_PREVIEW_ROW_LIMIT = 3;

export const TRUST_BADGES = [
  { title: "100% Secure", description: "Your data is safe with us." },
  { title: "Premium Picks", description: "High accuracy exclusive picks." },
  { title: "Better Success", description: "Boost your chances of winning." },
] as const;

import { ALL_COUNTRIES } from "@/lib/data/world-countries";

// "Other" is a deliberate catch-all entry (not a real country) -- it's the
// final rung of the price-lookup fallback chain in resolvePrice() and a
// valid plan_prices.country value for admins to set a default rate.
export const COUNTRIES = [...ALL_COUNTRIES.map((c) => c.name), "Other"] as const;
