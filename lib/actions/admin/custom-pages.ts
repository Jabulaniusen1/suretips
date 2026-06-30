"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

export type CustomPageInput = {
  slug: string;
  title: string;
  heading?: string;
  subheading?: string;
  description?: string;
  filter_id?: string;
  is_published: boolean;
  show_in_footer: boolean;
  footer_label?: string;
  meta_title?: string;
  meta_description?: string;
};

export async function createCustomPage(input: CustomPageInput) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("custom_pages").insert(input);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/pages");
}

export async function updateCustomPage(id: string, input: CustomPageInput) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("custom_pages").update(input).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/pages");
  revalidatePath(`/tips/${input.slug}`);
}

export async function deleteCustomPage(id: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("custom_pages").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/pages");
}
