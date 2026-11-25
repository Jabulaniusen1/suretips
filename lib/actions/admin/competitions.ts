"use server";

import { toActionResult } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

const text = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));

const schema = z.object({
  slug: z.string().trim().toLowerCase().min(2).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  name: z.string().trim().min(2).max(80),
  league_id: z.number().int().positive().nullable().optional(),
  status: z.enum(["active", "inactive"]),
  heading: text(120),
  subheading: text(200),
  introduction: text(1500),
  main_content: text(20000),
  seo_title: text(70),
  seo_description: text(170),
  country: text(60),
  competition_type: z.enum(["league", "cup"]).nullable().optional(),
  current_season: z.number().int().min(1990).max(2100).nullable().optional(),
  display_order: z.number().int().min(0).max(999).optional(),
  og_image: z.union([z.literal(""), z.string().trim().url().startsWith("https://")]).optional().transform((v) => (v ? v : null)),
});

export type CompetitionInput = z.input<typeof schema>;

function parse(input: CompetitionInput) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  return parsed.data;
}

function friendly(message: string) {
  return message.includes("duplicate key") ? "Another competition already uses this slug." : message;
}

async function authorize() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");
  return createClient();
}

async function createCompetitionImpl(input: CompetitionInput) {
  const supabase = await authorize();
  const { error } = await supabase.from("competitions").insert(parse(input));
  if (error) throw new Error(friendly(error.message));
  revalidatePath("/admin/competitions");
  revalidatePath("/", "layout");
}

async function updateCompetitionImpl(id: string, input: CompetitionInput) {
  const supabase = await authorize();
  if (!z.string().uuid().safeParse(id).success) throw new Error("Invalid competition");
  const { error } = await supabase.from("competitions").update(parse(input)).eq("id", id);
  if (error) throw new Error(friendly(error.message));
  revalidatePath("/admin/competitions");
  revalidatePath("/", "layout");
}

async function deleteCompetitionImpl(id: string) {
  const supabase = await authorize();
  if (!z.string().uuid().safeParse(id).success) throw new Error("Invalid competition");
  const { error } = await supabase.from("competitions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/competitions");
  revalidatePath("/", "layout");
}

// Exported actions return { ok, data | error } -- see lib/actions/result.ts.
export async function createCompetition(...args: Parameters<typeof createCompetitionImpl>) {
  return toActionResult(() => createCompetitionImpl(...args));
}
export async function updateCompetition(...args: Parameters<typeof updateCompetitionImpl>) {
  return toActionResult(() => updateCompetitionImpl(...args));
}
export async function deleteCompetition(...args: Parameters<typeof deleteCompetitionImpl>) {
  return toActionResult(() => deleteCompetitionImpl(...args));
}
