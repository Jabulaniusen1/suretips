import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getConversation(userId: string): Promise<Tables<"messages">[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("messages").select("*").eq("user_id", userId).order("created_at");
  return data ?? [];
}

export interface ConversationSummary {
  user_id: string;
  full_name: string | null;
  email: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export async function getAdminConversations(): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("messages")
    // messages has two foreign keys to users (user_id, sender_id); PostgREST
    // rejects an unqualified `users(...)` embed as ambiguous (PGRST201), which
    // left the admin inbox empty. Embed the conversation owner explicitly.
    .select("*, users!messages_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  const byUser = new Map<string, ConversationSummary>();
  for (const row of (messages ?? []) as unknown as Array<
    Tables<"messages"> & { users: { full_name: string | null; email: string } | null }
  >) {
    if (!byUser.has(row.user_id)) {
      byUser.set(row.user_id, {
        user_id: row.user_id,
        full_name: row.users?.full_name ?? null,
        email: row.users?.email ?? "",
        last_message: row.content,
        last_message_at: row.created_at,
        unread_count: 0,
      });
    }
    if (!row.read && row.sender_id === row.user_id) {
      byUser.get(row.user_id)!.unread_count += 1;
    }
  }

  return Array.from(byUser.values());
}
