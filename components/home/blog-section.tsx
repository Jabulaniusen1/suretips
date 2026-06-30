import Link from "next/link";
import Image from "next/image";
import { getRecentPublishedPosts } from "@/lib/data/blog";
import { formatShortDate } from "@/lib/utils/date";

export async function BlogSection() {
  const posts = await getRecentPublishedPosts(3);
  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-bold">From the Blog</h2>
        <Link href="/blog" className="text-sm font-medium text-brand hover:underline">
          View all posts
        </Link>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative aspect-video bg-secondary">
              {post.featured_image && (
                <Image src={post.featured_image} alt={post.title} fill className="object-cover" />
              )}
            </div>
            <div className="p-4">
              {post.published_at && (
                <p className="text-xs text-muted-foreground">{formatShortDate(post.published_at)}</p>
              )}
              <h3 className="mt-1 font-bold group-hover:text-brand">{post.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
