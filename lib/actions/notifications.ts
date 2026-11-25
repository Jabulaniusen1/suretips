"use server";

import { toActionResult } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function markNotificationReadImpl(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/notifications");
}

async function markAllNotificationsReadImpl(userId: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  revalidatePath("/dashboard/notifications");
}

// Exported actions return { ok, data | error } -- see lib/actions/result.ts.
export async function markNotificationRead(...args: Parameters<typeof markNotificationReadImpl>) {
  return toActionResult(() => markNotificationReadImpl(...args));
}
export async function markAllNotificationsRead(...args: Parameters<typeof markAllNotificationsReadImpl>) {
  return toActionResult(() => markAllNotificationsReadImpl(...args));
}
