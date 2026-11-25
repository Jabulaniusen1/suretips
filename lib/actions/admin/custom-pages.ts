"use server";

import { toActionResult } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";
import { HARD_RESERVED_TIPS_SLUGS, MARKET_PAGE_SLUGS, isMarketPageSlug } from "@/lib/seo/market-pages";
import { SLUG_RE, indexabilityIssues } from "@/lib/seo/custom-page-rules";
import { parseKeywords } from "@/lib/seo";

const text = (max: number) => z.string().trim().max(max).optional().default("");

const schema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(80)
    .regex(SLUG_RE, "Use lowercase letters, numbers and single hyphens")
    .refine((s) => !HARD_RESERVED_TIPS_SLUGS.has(s), "This slug is reserved"),
  title: z.string().trim().min(2).max(120),
  heading: text(120),
  subheading: text(200),
  introduction: text(1200),
  main_content: text(20000),
  meta_title: text(70),
  meta_description: text(170),
  meta_keywords: text(500),
  filter_id: z.union([z.literal(""), z.literal("all"), z.enum(MARKET_PAGE_SLUGS as [string, ...string[]])]).default("all"),
  is_published: z.boolean(),
  noindex: z.boolean(),
  canonical_url: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || v.startsWith("https://"), "Use a path like /tips/btts or an https:// URL")
    .default(""),
  og_image: z.union([z.literal(""), z.string().trim().url().startsWith("https://")]).default(""),
  show_in_footer: z.boolean(),
  footer_label: text(40),
  faq: z.array(z.object({ question: z.string().trim().min(5).max(200), answer: z.string().trim().min(10).max(1000) })).max(10).default([]),
  related_links: z
    .array(z.object({ label: z.string().trim().min(2).max(80), href: z.string().trim().regex(/^\/[a-z0-9/_-]*$/i, "Internal paths only, e.g. /tips/btts") }))
    .max(10)
    .default([]),
});

export type CustomPageInput = z.input<typeof schema>;

function validate(input: CustomPageInput) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `${i.path.join(".") || "page"}: ${i.message}`).join("; "));
  const data = parsed.data;

  // A built-in market slug makes this row an override of that page's SEO
  // fields; the built-in copy fills anything left empty, so it is never thin.
  const isOverride = isMarketPageSlug(data.slug);
  if (isOverride && data.canonical_url) throw new Error("Built-in market pages can't be canonicalised elsewhere.");

  // Never publish an incomplete standalone page as indexable: either finish
  // it, keep it as a draft, or explicitly mark it noindex.
  if (!isOverride && data.is_published && !data.noindex && !data.canonical_url) {
    const issues = indexabilityIssues({ ...data, description: null });
    if (issues.length > 0) {
      throw new Error(`Not ready to publish as an indexable page: ${issues.join(", ")}. Complete it, save as a draft, or tick “noindex”.`);
    }
  }

  return {
    ...data,
    heading: data.heading || null,
    subheading: data.subheading || null,
    introduction: data.introduction || null,
    main_content: data.main_content || null,
    meta_title: data.meta_title || null,
    meta_description: data.meta_description || null,
    // Stored normalised: trimmed, de-duplicated, comma-separated.
    meta_keywords: parseKeywords(data.meta_keywords).join(", ") || null,
    canonical_url: data.canonical_url || null,
    og_image: data.og_image || null,
    footer_label: data.footer_label || null,
    filter_id: isOverride ? data.slug : data.filter_id || "all",
    // Built-in pages are already linked from navigation and the footer.
    show_in_footer: isOverride ? false : data.show_in_footer,
  };
}

function friendly(message: string) {
  if (message.includes("custom_pages_slug_key") || message.includes("duplicate key")) return "Another page already uses this slug.";
  return message;
}

async function authorize() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");
  return createClient();
}

async function createCustomPageImpl(input: CustomPageInput) {
  const supabase = await authorize();
  const data = validate(input);
  const { error } = await supabase.from("custom_pages").insert(data);
  if (error) throw new Error(friendly(error.message));
  revalidatePath("/admin/pages");
  revalidatePath("/", "layout");
}

async function updateCustomPageImpl(id: string, input: CustomPageInput) {
  const supabase = await authorize();
  if (!z.string().uuid().safeParse(id).success) throw new Error("Invalid page");
  const data = validate(input);
  const { error } = await supabase.from("custom_pages").update(data).eq("id", id);
  if (error) throw new Error(friendly(error.message));
  revalidatePath("/admin/pages");
  revalidatePath("/", "layout");
}

async function deleteCustomPageImpl(id: string) {
  const supabase = await authorize();
  if (!z.string().uuid().safeParse(id).success) throw new Error("Invalid page");
  const { error } = await supabase.from("custom_pages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/pages");
  revalidatePath("/", "layout");
}

// Exported actions return { ok, data | error } -- see lib/actions/result.ts.
export async function createCustomPage(...args: Parameters<typeof createCustomPageImpl>) {
  return toActionResult(() => createCustomPageImpl(...args));
}
export async function updateCustomPage(...args: Parameters<typeof updateCustomPageImpl>) {
  return toActionResult(() => updateCustomPageImpl(...args));
}
export async function deleteCustomPage(...args: Parameters<typeof deleteCustomPageImpl>) {
  return toActionResult(() => deleteCustomPageImpl(...args));
}
