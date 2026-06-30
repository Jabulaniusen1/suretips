import { ALL_COUNTRIES } from "@/lib/data/world-countries";

const COUNTRY_TO_CURRENCY: Record<string, string> = Object.fromEntries(
  ALL_COUNTRIES.map((c) => [c.name, c.currency])
);

export const CURRENCY_CODES: string[] = Array.from(new Set(ALL_COUNTRIES.map((c) => c.currency))).sort();

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  GHS: "GH₵",
  KES: "KSh",
  ZAR: "R",
  USD: "$",
  GBP: "£",
  EUR: "€",
  USDT: "USDT",
};

export function getCurrencyFromCountry(country: string): string {
  return COUNTRY_TO_CURRENCY[country] ?? "USD";
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function formatPrice(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString()}`;
}
