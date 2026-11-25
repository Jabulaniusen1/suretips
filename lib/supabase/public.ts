import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

/**
 * Anonymous, cookie-free client for public reads (predictions, blog,
 * competitions, results). Unlike the cookie-based server client it doesn't
 * touch request headers, so it also works in sitemap/robots/OG handlers and
 * never accidentally reads data with an admin's session. RLS applies as for
 * any anonymous visitor.
 */
export function createPublicClient() {
  if (!client) {
    client = createSupabaseClient<Database>(supabaseUrl(), supabaseAnonKey(), {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return client;
}
