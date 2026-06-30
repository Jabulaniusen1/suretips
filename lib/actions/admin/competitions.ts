"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";
import type { Tables } from "@/types/database";

export type CompetitionInput = {
  slug: string;
  name: string;
  league_id?: number;
  status: Tables<"competitions">["status"];
  heading?: string;
  subheading?: string;
  introduction?: string;
  seo_title?: string;
  seo_description?: string;
};

export async function createCompetition(input: CompetitionInput) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("competitions").insert(input);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/competitions");
  revalidatePath("/competitions");
}

export async function updateCompetition(id: string, input: CompetitionInput) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("competitions").update(input).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/competitions");
  revalidatePath("/competitions");
}

export async function deleteCompetition(id: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("competitions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/competitions");
}
