import { ALL_COUNTRIES } from "@/lib/data/world-countries";

// Country choices for the account settings form. "Other" is a catch-all.
export const COUNTRIES = [...ALL_COUNTRIES.map((c) => c.name), "Other"] as const;
