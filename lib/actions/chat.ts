"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(conversationUserId: string, content: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");

  const { error } = await supabase.from("messages").insert({
    user_id: conversationUserId,
    sender_id: data.user.id,
    content,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/chat");
  revalidatePath("/admin/chat");
}

export async function markConversationRead(conversationUserId: string) {
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
