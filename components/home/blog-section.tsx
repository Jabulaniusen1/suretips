import Link from "next/link";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/images";
import { getRecentPublishedPosts } from "@/lib/data/blog";
import { formatShortDate } from "@/lib/utils/date";

export async function BlogSection() {
  const posts = await getRecentPublishedPosts(3);

  return (
    <section aria-labelledby="home-blog" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="home-blog" className="text-xl font-bold">
          Football guides &amp; analysis
        </h2>
        <Link href="/blog" className="text-sm font-medium text-brand hover:underline">
          All articles
        </Link>
      </div>
      {posts.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          Match previews, betting guides and analysis will appear here soon.
        </div>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-video bg-secondary">
                {post.featured_image && (
                  <Image
                    src={post.featured_image}
                    unoptimized={!canOptimizeImage(post.featured_image)}
                    alt={post.featured_image_alt ?? ""}
                    fill
                    sizes="(min-width: 1280px) 400px, (min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                {post.published_at && (
                  <time dateTime={post.published_at} className="text-xs text-muted-foreground">
                    {formatShortDate(post.published_at)}
                  </time>
                )}
                <h3 className="mt-1 font-bold group-hover:text-brand">{post.title}</h3>
                {post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
