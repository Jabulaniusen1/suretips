"use server";

import { toActionResult } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

async function createAdLinkImpl(input: { title: string; url: string; description?: string; is_active: boolean }) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("ad_links").insert(input);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/ad-links");
  revalidatePath("/", "layout"); // ad links show in the site header
}

async function deleteAdLinkImpl(id: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("ad_links").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/ad-links");
  revalidatePath("/", "layout"); // ad links show in the site header
}

async function toggleAdLinkActiveImpl(id: string, isActive: boolean) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("ad_links").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/ad-links");
  revalidatePath("/", "layout"); // ad links show in the site header
}

// Exported actions return { ok, data | error } -- see lib/actions/result.ts.
export async function createAdLink(...args: Parameters<typeof createAdLinkImpl>) {
  return toActionResult(() => createAdLinkImpl(...args));
}
export async function deleteAdLink(...args: Parameters<typeof deleteAdLinkImpl>) {
  return toActionResult(() => deleteAdLinkImpl(...args));
}
export async function toggleAdLinkActive(...args: Parameters<typeof toggleAdLinkActiveImpl>) {
  return toActionResult(() => toggleAdLinkActiveImpl(...args));
}
