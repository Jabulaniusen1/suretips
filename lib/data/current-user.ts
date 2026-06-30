import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export interface CurrentUser {
  authId: string;
  email: string;
  profile: Tables<"users">;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).single();
  if (!profile) return null;

  return { authId: data.user.id, email: data.user.email ?? profile.email, profile };
}

export async function getUnreadCounts(userId: string) {
  const supabase = await createClient();
  const [{ count: notifications }, { count: messages }] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("read", false),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false)
      .neq("sender_id", userId),
  ]);

  return { notifications: notifications ?? 0, messages: messages ?? 0 };
}
