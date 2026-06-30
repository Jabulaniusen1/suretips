import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getRecentPublishedPosts(limit = 3): Promise<Tables<"blog_posts">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getPublishedPosts(page = 1, pageSize = 9) {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const { data, count } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .eq("published", true)
    .order("published_at", { ascending: false })
    .range(from, from + pageSize - 1);

  return { posts: data ?? [], total: count ?? 0 };
}

export async function getPostBySlug(slug: string): Promise<Tables<"blog_posts"> | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (data) await supabase.rpc("increment_blog_post_views", { post_id: data.id });
  return data;
}
