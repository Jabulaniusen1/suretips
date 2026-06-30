import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/data/blog";
import { formatShortDate } from "@/lib/utils/date";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {post.featured_image && (
        <div className="relative mb-6 aspect-video overflow-hidden rounded-2xl bg-secondary">
          <Image src={post.featured_image} alt={post.title} fill className="object-cover" />
        </div>
      )}
      <h1 className="text-3xl font-bold">{post.title}</h1>
      {post.published_at && (
        <p className="mt-2 text-sm text-muted-foreground">{formatShortDate(post.published_at)} · {post.view_count} views</p>
      )}
      <div className="prose prose-neutral mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
    </article>
  );
}
