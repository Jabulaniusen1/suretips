// Environment variable access with clear failure messages.
//
// Public values (NEXT_PUBLIC_*) are inlined into the client bundle at build
// time, so they must be read with literal `process.env.NEXT_PUBLIC_X`
// expressions -- never through a dynamic key.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See .env.local.example.`);
  }
  return value;
}

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Server-only. Never expose this key to the browser. */
export function supabaseServiceRoleKey(): string {
  if (typeof window !== "undefined") throw new Error("SUPABASE_SERVICE_ROLE_KEY must not be read in the browser");
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const DEV_SITE_URL = "http://localhost:3000";

/**
 * Canonical origin, e.g. https://surematchtips.com (no trailing slash).
 * Every canonical URL, sitemap entry, Open Graph URL and JSON-LD id is built
 * from this value, so production must set NEXT_PUBLIC_SITE_URL to the single
 * preferred https origin.
 */
export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || DEV_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL is not a valid URL: ${raw}`);
  }
}
