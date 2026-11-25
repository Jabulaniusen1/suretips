import { RESERVED_TIPS_SLUGS, isMarketPageSlug } from "@/lib/seo/market-pages";
import { plainTextOf } from "@/lib/content/plain-text";
import type { Tables } from "@/types/database";

// Indexability rules for admin-created SEO landing pages. Shared by the
// public page (robots meta), the sitemap and the admin editor.

/** Minimum combined intro + body length (characters) for an indexable page. */
export const MIN_INDEXABLE_CONTENT_LENGTH = 600;
export const MIN_INTRODUCTION_LENGTH = 150;
export const MIN_META_DESCRIPTION_LENGTH = 70;

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type PageFields = Pick<
  Tables<"custom_pages">,
  "slug" | "is_published" | "noindex" | "canonical_url" | "introduction" | "main_content" | "description" | "meta_title" | "meta_description" | "heading"
>;

export function customPageContentLength(page: Pick<PageFields, "introduction" | "main_content" | "description">): number {
  // Count the words readers see: formatting markers ("## ", "**", link URLs) don't count.
  const text = [page.introduction, page.main_content, page.description].filter(Boolean).join("\n\n");
  return plainTextOf(text.replace(/<[^>]+>/g, " ")).length;
}

/** Problems that keep a page out of the index (empty = indexable). */
export function indexabilityIssues(page: PageFields): string[] {
  const issues: string[] = [];
  if (!page.is_published) issues.push("not published");
  if (page.noindex) issues.push("marked noindex");
  if (page.canonical_url) issues.push("canonicalised to another URL");
  if (isMarketPageSlug(page.slug)) issues.push("this slug overrides a built-in market page (indexed as that page)");
  else if (RESERVED_TIPS_SLUGS.has(page.slug)) issues.push("slug is reserved");
  if (!page.heading?.trim()) issues.push("missing H1 heading");
  if (!page.meta_title?.trim()) issues.push("missing SEO title");
  if ((page.meta_description?.trim().length ?? 0) < MIN_META_DESCRIPTION_LENGTH) issues.push(`meta description under ${MIN_META_DESCRIPTION_LENGTH} characters`);
  if ((page.introduction?.trim().length ?? 0) < MIN_INTRODUCTION_LENGTH) issues.push(`introduction under ${MIN_INTRODUCTION_LENGTH} characters`);
  if (customPageContentLength(page) < MIN_INDEXABLE_CONTENT_LENGTH) issues.push(`under ${MIN_INDEXABLE_CONTENT_LENGTH} characters of original content`);
  return issues;
}

export function isCustomPageIndexable(page: PageFields): boolean {
  return indexabilityIssues(page).length === 0;
}
