import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).single();
  if (!profile?.is_admin) return null;

  return { authId: data.user.id, profile };
}

export async function getAdminBadgeCounts() {
  const supabase = await createClient();
  const [{ count: transactions }, { data: unreadMessages }] = await Promise.all([
    supabase.from("transactions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("messages").select("user_id, sender_id, read").eq("read", false),
  ]);

  const chat = (unreadMessages ?? []).filter((m) => m.sender_id === m.user_id).length;

  return { transactions: transactions ?? 0, chat };
}
