"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(input: { full_name: string; country: string; avatar_url?: string }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");

  const { error } = await supabase.from("users").update(input).eq("id", data.user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}
