import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side admin check used by every admin page and server action. The
 * proxy also guards /admin, but that is a convenience -- authorisation is
 * enforced here and by RLS (public.is_admin()).
 */
export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).single();
  if (!profile?.is_admin) return null;

  return { authId: data.user.id, profile };
});

export async function getAdminBadgeCounts() {
  const supabase = await createClient();
  const { count: results } = await supabase
    .from("predictions")
    .select("id", { count: "exact", head: true })
    .eq("result_approved", false)
    .neq("result", "pending");

  // Support chat is disabled (user accounts are turned off), so there are no
  // unread user messages to count.
  // const { data: unreadMessages } = await supabase.from("messages").select("user_id, sender_id").eq("read", false);
  // const chat = (unreadMessages ?? []).filter((m) => m.sender_id === m.user_id).length;
  return { results: results ?? 0, chat: 0 };
}
