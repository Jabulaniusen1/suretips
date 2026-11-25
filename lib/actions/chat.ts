"use server";

import { toActionResult } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

async function sendMessageImpl(conversationUserId: string, content: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  const text = content.trim().slice(0, 4000);
  if (!text) throw new Error("Message is empty");
  // Users write only in their own support thread; replying to someone else's is admin-only.
  if (conversationUserId !== data.user.id && !(await requireAdmin())) throw new Error("Forbidden");

  const { data: message, error } = await supabase
    .from("messages")
    .insert({ user_id: conversationUserId, sender_id: data.user.id, content: text })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/chat");
  revalidatePath("/admin/chat");
  return message;
}

async function markConversationReadImpl(conversationUserId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  await supabase
    .from("messages")
    .update({ read: true })
    .eq("user_id", conversationUserId)
    .neq("sender_id", data.user.id);

  revalidatePath("/dashboard/chat");
  revalidatePath("/admin/chat");
}

// Exported actions return { ok, data | error } -- see lib/actions/result.ts.
export async function sendMessage(...args: Parameters<typeof sendMessageImpl>) {
  return toActionResult(() => sendMessageImpl(...args));
}
export async function markConversationRead(...args: Parameters<typeof markConversationReadImpl>) {
  return toActionResult(() => markConversationReadImpl(...args));
}
