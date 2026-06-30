"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

export type BlogPostInput = {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  published: boolean;
  scheduled_at?: string;
  meta_title?: string;
  meta_description?: string;
  tags: string[];
  competition_id?: string;
};

export async function createBlogPost(input: BlogPostInput) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").insert({
    ...input,
    author_id: admin.authId,
    published_at: input.published ? new Date().toISOString() : null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function updateBlogPost(id: string, input: BlogPostInput, wasPublished: boolean) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase
    .from("blog_posts")
    .update({
      ...input,
      published_at: input.published && !wasPublished ? new Date().toISOString() : undefined,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${input.slug}`);
}

export async function deleteBlogPost(id: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
