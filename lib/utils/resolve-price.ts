import type { Tables } from "@/types/database";

export function resolvePrice(
  prices: Tables<"plan_prices">[],
  country: string,
  durationDays: 7 | 30
): Tables<"plan_prices"> | null {
  const candidates = [country, "USD", "Other"];
  for (const candidate of candidates) {
    const match = prices.find((p) => p.country === candidate && p.duration_days === durationDays);
    if (match) return match;
  }
  return prices.find((p) => p.duration_days === durationDays) ?? null;
}
