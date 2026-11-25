"use server";

import { toActionResult } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";
import { canOptimizeImage } from "@/lib/images";

const text = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));

const schema = z.object({
  title: z.string().trim().min(5).max(160),
  slug: z.string().trim().toLowerCase().min(3).max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  content: z.string().min(50, "Write the article before saving").max(200_000),
  excerpt: text(300),
  featured_image: z.union([z.literal(""), z.string().trim().url().startsWith("https://")]).optional().transform((v) => (v ? v : null)),
  featured_image_alt: text(200),
  category: text(60),
  author_name: text(80),
  meta_title: text(70),
  meta_description: text(170),
  tags: z.array(z.string().trim().min(1).max(40)).max(15),
  competition_id: z.string().uuid().nullable().optional(),
  /** "draft" | "publish" (now) | "schedule" (at scheduled_at) */
  publishMode: z.enum(["draft", "publish", "schedule"]),
  scheduled_at: z.string().datetime({ offset: true }).nullable().optional(),
});

export type BlogPostInput = z.input<typeof schema>;

function prepare(input: BlogPostInput, existing?: { published: boolean; published_at: string | null }) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  const { publishMode, scheduled_at, ...data } = parsed.data;

  if (data.featured_image && !data.featured_image_alt) throw new Error("Add alt text describing the featured image.");
  if (data.featured_image && !canOptimizeImage(data.featured_image)) {
    throw new Error("Upload the featured image to Supabase Storage (the editor's image upload) so it can be optimised; external image hosts load slowly.");
  }

  if (publishMode === "schedule") {
    if (!scheduled_at || new Date(scheduled_at).getTime() <= Date.now()) throw new Error("Pick a future date and time to schedule the post.");
    return { ...data, published: false, scheduled_at, published_at: null };
  }
  if (publishMode === "publish") {
    // Keep the original publication date when re-saving a published post.
    const publishedAt = existing?.published && existing.published_at ? existing.published_at : new Date().toISOString();
    return { ...data, published: true, scheduled_at: null, published_at: publishedAt };
  }
  return { ...data, published: false, scheduled_at: null, published_at: existing?.published_at ?? null };
}

function friendly(message: string) {
  return message.includes("duplicate key") ? "Another post already uses this slug." : message;
}

async function authorize() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");
  return { admin, supabase: await createClient() };
}

async function createBlogPostImpl(input: BlogPostInput) {
  const { admin, supabase } = await authorize();
  const { error } = await supabase.from("blog_posts").insert({ ...prepare(input), author_id: admin.authId });
  if (error) throw new Error(friendly(error.message));
  revalidatePath("/admin/blog");
  revalidatePath("/", "layout");
}

async function updateBlogPostImpl(id: string, input: BlogPostInput) {
  const { supabase } = await authorize();
  if (!z.string().uuid().safeParse(id).success) throw new Error("Invalid post");
  const { data: existing, error: readError } = await supabase.from("blog_posts").select("published, published_at, slug").eq("id", id).maybeSingle();
  if (readError || !existing) throw new Error(readError?.message ?? "Post not found");

  const { error } = await supabase.from("blog_posts").update(prepare(input, existing)).eq("id", id);
  if (error) throw new Error(friendly(error.message));
  revalidatePath("/admin/blog");
  revalidatePath("/", "layout");
}

async function deleteBlogPostImpl(id: string) {
  const { supabase } = await authorize();
  if (!z.string().uuid().safeParse(id).success) throw new Error("Invalid post");
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/blog");
  revalidatePath("/", "layout");
}

// Exported actions return { ok, data | error } -- see lib/actions/result.ts.
export async function createBlogPost(...args: Parameters<typeof createBlogPostImpl>) {
  return toActionResult(() => createBlogPostImpl(...args));
}
export async function updateBlogPost(...args: Parameters<typeof updateBlogPostImpl>) {
  return toActionResult(() => updateBlogPostImpl(...args));
}
export async function deleteBlogPost(...args: Parameters<typeof deleteBlogPostImpl>) {
  return toActionResult(() => deleteBlogPostImpl(...args));
}
