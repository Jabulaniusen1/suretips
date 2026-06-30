"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  revalidatePath("/dashboard/notifications");
}
