import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/data/blog";
import { formatShortDate } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? "1");
  const { posts, total } = await getPublishedPosts(page);
  const totalPages = Math.max(1, Math.ceil(total / 9));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Blog</h1>
      <p className="mt-2 text-muted-foreground">Tips, guides, and analysis from the Kingpredicts team.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative aspect-video bg-secondary">
              {post.featured_image && <Image src={post.featured_image} alt={post.title} fill className="object-cover" />}
            </div>
            <div className="p-4">
              {post.published_at && <p className="text-xs text-muted-foreground">{formatShortDate(post.published_at)}</p>}
              <h2 className="mt-1 font-bold group-hover:text-brand">{post.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
            </div>
          </Link>
        ))}
        {posts.length === 0 && <p className="text-muted-foreground">No posts published yet.</p>}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/blog?page=${p}`}
              className={`rounded-md px-3 py-1.5 text-sm ${p === page ? "bg-brand text-brand-foreground" : "border border-border"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
