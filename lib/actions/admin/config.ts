"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

export async function updateSiteConfig(key: string, value: Record<string, unknown> | string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_config")
    .upsert({ key, value: value as Record<string, unknown>, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/config");
  revalidatePath("/");
}
