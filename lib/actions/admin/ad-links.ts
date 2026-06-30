"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

export async function createAdLink(input: { title: string; url: string; description?: string; is_active: boolean }) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("ad_links").insert(input);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/ad-links");
}

export async function deleteAdLink(id: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("ad_links").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/ad-links");
}

export async function toggleAdLinkActive(id: string, isActive: boolean) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("ad_links").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/ad-links");
}
