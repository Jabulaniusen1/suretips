import Link from "next/link";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/images";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BLOG_PAGE_SIZE, getPublishedPosts } from "@/lib/data/blog";
import { formatShortDate } from "@/lib/utils/date";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";

type Props = { searchParams: Promise<{ page?: string }> };

function parsePage(raw?: string): number | null {
  if (raw === undefined) return 1;
  return /^[1-9]\d{0,3}$/.test(raw) ? Number(raw) : null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  if (!page) notFound();
  // Each paginated page is its own canonical URL; page 1 is the bare /blog.
  return pageMetadata({
    title: page > 1 ? `Football Betting Guides & Analysis – Page ${page}` : "Football Betting Guides & Match Analysis",
    description:
      "Guides to football betting markets, league analysis and explainers on how predictions, odds and probability work — written to help you bet with your eyes open.",
    path: page > 1 ? `/blog?page=${page}` : "/blog",
  });
}

export default async function BlogPage({ searchParams }: Props) {
  const page = parsePage((await searchParams).page);
  if (!page) notFound();
  const { posts, total } = await getPublishedPosts(page);
  const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
  if (page > totalPages) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: "Blog", path: "/blog" }]} />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Football Guides &amp; Analysis</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Explainers on betting markets, league and team analysis, and how to read odds and probability. For today&apos;s picks, see{" "}
        <Link href="/" className="font-medium text-brand hover:underline">
          football predictions today
        </Link>
        .
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <article key={post.id} className="group overflow-hidden rounded-2xl border border-border bg-card">
            <Link href={`/blog/${post.slug}`}>
              <div className="relative aspect-video bg-secondary">
                {post.featured_image && (
                  <Image
                    src={post.featured_image}
                    unoptimized={!canOptimizeImage(post.featured_image)}
                    alt={post.featured_image_alt ?? ""}
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">
                  {post.category && <span className="font-medium text-brand">{post.category} · </span>}
                  {post.published_at && <time dateTime={post.published_at}>{formatShortDate(post.published_at)}</time>}
                </p>
                <h2 className="mt-1 font-bold group-hover:text-brand">{post.title}</h2>
                {post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
              </div>
            </Link>
          </article>
        ))}
      </div>
      {posts.length === 0 && <p className="mt-8 text-muted-foreground">No articles have been published yet.</p>}

      {totalPages > 1 && (
        <nav aria-label="Blog pages" className="mt-8 flex flex-wrap justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={p === 1 ? "/blog" : `/blog?page=${p}`}
              aria-current={p === page ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm ${p === page ? "bg-brand text-brand-foreground" : "border border-border"}`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
