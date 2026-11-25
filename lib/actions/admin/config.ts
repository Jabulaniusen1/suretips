"use server";

import { toActionResult } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

const optionalUrl = z.union([z.literal(""), z.string().trim().url().startsWith("https://", "Links must use https://")]);

const configSchema = z.object({
  telegram_url: optionalUrl,
  whatsapp_number: z.string().trim().max(32).regex(/^[+\d\s()-]*$/, "Use digits, spaces and + only"),
  contact_email: z.union([z.literal(""), z.string().trim().email()]),
  support_link: optionalUrl,
  social_links: z.object({
    facebook: optionalUrl,
    twitter: optionalUrl,
    instagram: optionalUrl,
    youtube: optionalUrl,
  }),
});

export type SiteConfigInput = z.infer<typeof configSchema>;

async function saveSiteConfigImpl(input: SiteConfigInput) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const parsed = configSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));

  const supabase = await createClient();
  const updatedAt = new Date().toISOString();
  const rows = Object.entries(parsed.data).map(([key, value]) => ({ key, value: value as unknown as Record<string, unknown>, updated_at: updatedAt }));
  const { error } = await supabase.from("site_config").upsert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

// Exported actions return { ok, data | error } -- see lib/actions/result.ts.
export async function saveSiteConfig(...args: Parameters<typeof saveSiteConfigImpl>) {
  return toActionResult(() => saveSiteConfigImpl(...args));
}
