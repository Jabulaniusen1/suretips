"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

export async function toggleUserAdmin(id: string, isAdmin: boolean) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ is_admin: isAdmin }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}
