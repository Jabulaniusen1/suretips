import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

// Only the admin area and its login need the Supabase session refreshed.
// Public pages never read the session, so they skip this round-trip to
// Supabase Auth entirely (faster responses, and they stay cacheable).
// User accounts are turned off, so "/dashboard/:path*" and "/signup" are no
// longer matched (next.config.ts redirects them).
export const config = {
  matcher: ["/admin/:path*", "/login"],
};
