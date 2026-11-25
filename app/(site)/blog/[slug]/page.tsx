import Link from "next/link";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/images";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { getPostBySlug, getRelatedPosts, recordPostView } from "@/lib/data/blog";
import { getActiveCompetitions } from "@/lib/data/competitions";
import { MARKET_PAGES } from "@/lib/seo/market-pages";
import { formatShortDate } from "@/lib/utils/date";
import { blogPostingJsonLd, pageMetadata, stripHtml, truncateDescription, SITE_NAME } from "@/lib/seo";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ResponsibleNotice } from "@/components/site/responsible-notice";

export const revalidate = 600;

/** Render each URL on first visit, then serve it from the ISR cache. */
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const description = truncateDescription(post.meta_description || post.excerpt || stripHtml(post.content ?? "") || post.title);
  return pageMetadata({
    title: post.meta_title || post.title,
    description,
    path: `/blog/${slug}`,
    type: "article",
    publishedTime: post.published_at ?? undefined,
    modifiedTime: post.updated_at,
    image: post.featured_image ? { url: post.featured_image, alt: post.featured_image_alt || post.title } : undefined,
  });
}

/** Market pages whose topic the article mentions, for contextual internal links. */
function relatedMarketPages(text: string) {
  const haystack = text.toLowerCase();
  return MARKET_PAGES.filter((page) =>
    [page.primaryKeyword, page.tabLabel, ...page.supportingKeywords].some((k) => k.length > 3 && haystack.includes(k.toLowerCase().replace(/ today$/, "")))
  ).slice(0, 4);
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  after(() => recordPostView(post.id));

  const [related, competitions] = await Promise.all([getRelatedPosts(post), getActiveCompetitions()]);
  const competition = post.competition_id ? competitions.find((c) => c.id === post.competition_id) : undefined;
  const html = sanitizeHtml(post.content ?? "");
  const plain = stripHtml(html);
  const markets = relatedMarketPages(`${post.title} ${post.tags.join(" ")} ${plain}`);
  const published = post.published_at ?? post.created_at;
  const updated = post.updated_at;
  const wasUpdated = new Date(updated).getTime() - new Date(published).getTime() > 24 * 60 * 60 * 1000;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${slug}` }]} />
      <JsonLd
        data={blogPostingJsonLd({
          title: post.title,
          description: post.meta_description || post.excerpt || truncateDescription(plain),
          path: `/blog/${slug}`,
          datePublished: published,
          dateModified: updated,
          authorName: post.author_name,
          image: post.featured_image,
          section: post.category,
          keywords: post.tags,
        })}
      />

      <header className="mt-4">
        {post.category && <p className="text-sm font-semibold text-brand">{post.category}</p>}
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{post.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          By {post.author_name || `the ${SITE_NAME} editorial team`} · Published <time dateTime={published}>{formatShortDate(published)}</time>
          {wasUpdated && (
            <>
              {" "}
              · Updated <time dateTime={updated}>{formatShortDate(updated)}</time>
            </>
          )}
        </p>
      </header>

      {post.featured_image && (
        <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl bg-secondary">
          <Image
            src={post.featured_image}
            unoptimized={!canOptimizeImage(post.featured_image)}
            alt={post.featured_image_alt ?? ""}
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />

      {post.tags.length > 0 && (
        <ul aria-label="Tags" className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              {tag}
            </li>
          ))}
        </ul>
      )}

      {(markets.length > 0 || competition) && (
        <aside aria-labelledby="related-predictions" className="mt-10 rounded-2xl border border-border bg-card p-5">
          <h2 id="related-predictions" className="font-bold">
            Related predictions
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {competition && (
              <li>
                <Link href={`/competitions/${competition.slug}`} className="font-medium text-brand hover:underline">
                  {competition.name} predictions and fixtures
                </Link>
              </li>
            )}
            {markets.map((page) => (
              <li key={page.slug}>
                <Link href={`/tips/${page.slug}`} className="font-medium text-brand hover:underline">
                  {page.h1}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-posts" className="mt-10">
          <h2 id="related-posts" className="text-lg font-bold">
            Related articles
          </h2>
          <ul className="mt-3 space-y-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/blog/${r.slug}`} className="font-medium text-brand hover:underline">
                  {r.title}
                </Link>
                {r.excerpt && <p className="text-sm text-muted-foreground">{r.excerpt}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ResponsibleNotice className="mt-10" />
    </article>
  );
}
