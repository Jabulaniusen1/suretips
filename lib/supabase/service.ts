import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role client for trusted server-side jobs only: the CRON_SECRET-
 * gated routes under app/api/** and admin-authorised server actions that run
 * those same jobs on demand. The service role key bypasses RLS, so callers
 * must do their own authorisation first. `server-only` makes importing this
 * module from a Client Component a build error.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
