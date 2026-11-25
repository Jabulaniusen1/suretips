import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/types/database";

export const BLOG_PAGE_SIZE = 9;

const LIST_COLUMNS =
  "id, title, slug, excerpt, featured_image, featured_image_alt, category, tags, author_name, published_at, updated_at, competition_id";

export type BlogListItem = Pick<
  Tables<"blog_posts">,
  "id" | "title" | "slug" | "excerpt" | "featured_image" | "featured_image_alt" | "category" | "tags" | "author_name" | "published_at" | "updated_at" | "competition_id"
>;

const nowIso = () => new Date().toISOString();

export const getRecentPublishedPosts = cache(async (limit = 3): Promise<BlogListItem[]> => {
  const { data, error } = await createPublicClient().from("blog_posts").select(LIST_COLUMNS).eq("published", true).lte("published_at", nowIso())
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) console.error(`[blog] recent: ${error.message}`);
  return (data ?? []) as BlogListItem[];
});

export async function getPublishedPosts(page = 1, pageSize = BLOG_PAGE_SIZE): Promise<{ posts: BlogListItem[]; total: number }> {
  const from = (page - 1) * pageSize;
  const { data, count, error } = await createPublicClient().from("blog_posts").select(LIST_COLUMNS, { count: "exact" }).eq("published", true).lte("published_at", nowIso())
    .order("published_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) console.error(`[blog] list: ${error.message}`);
  return { posts: (data ?? []) as BlogListItem[], total: count ?? 0 };
}

/** Pure read -- safe to call from generateMetadata and the page. */
export const getPostBySlug = cache(async (slug: string): Promise<Tables<"blog_posts"> | null> => {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  const { data, error } = await createPublicClient().from("blog_posts").select("*").eq("slug", slug).eq("published", true).lte("published_at", nowIso()).maybeSingle();
  if (error) throw new Error(`Could not load post ${slug}: ${error.message}`);
  return data;
});

export async function recordPostView(postId: string): Promise<void> {
  const { error } = await createPublicClient().rpc("increment_blog_post_views", { post_id: postId });
  if (error) console.error(`[blog] view count: ${error.message}`);
}

/** Posts sharing the category, competition or a tag with the given post. */
export const getRelatedPosts = cache(async (post: Pick<Tables<"blog_posts">, "id" | "category" | "competition_id" | "tags">, limit = 3): Promise<BlogListItem[]> => {
  const candidates = await getRecentPublishedPosts(30);
  const tags = new Set(post.tags.map((t) => t.toLowerCase()));
  return candidates
    .filter((c) => c.id !== post.id)
    .map((c) => ({
      post: c,
      score:
        (post.competition_id && c.competition_id === post.competition_id ? 3 : 0) +
        (post.category && c.category === post.category ? 2 : 0) +
        c.tags.filter((t) => tags.has(t.toLowerCase())).length,
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => c.post);
});

export const getPostsForCompetition = cache(async (competitionId: string, limit = 3): Promise<BlogListItem[]> => {
  const { data, error } = await createPublicClient().from("blog_posts").select(LIST_COLUMNS).eq("competition_id", competitionId).eq("published", true).lte("published_at", nowIso())
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) console.error(`[blog] competition: ${error.message}`);
  return (data ?? []) as BlogListItem[];
});
