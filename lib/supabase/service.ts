import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client for trusted server-to-server jobs only (cron routes
 * under app/api/**). These run with no user session, so RLS can't grant
 * them anything -- the service role key bypasses RLS entirely. Never import
 * this outside CRON_SECRET-gated routes, and never expose the key to the
 * client (no NEXT_PUBLIC_ prefix).
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
