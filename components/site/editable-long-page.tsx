import type { ReactNode } from "react";
import { LegalPage } from "@/components/site/legal-page";
import { PlainContent } from "@/components/content/plain-content";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteText } from "@/lib/content/site-text";
import { parseFaqText, type TextVars } from "@/lib/content/registry";
import { plainTextOf } from "@/lib/content/plain-text";
import type { LongPageSlug } from "@/lib/content/page-defaults";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

const BLOCK_LINE = /^\{\{([a-z0-9-]+)\}\}$/;

/** Metadata for a long page from its admin-edited SEO title and description. */
export async function longPageMetadata(slug: LongPageSlug) {
  const text = await getSiteText();
  return pageMetadata({ title: text.t(`page.${slug}.seoTitle`), description: text.t(`page.${slug}.seoDescription`), path: `/${slug}` });
}

/**
 * About, Methodology, FAQ and the legal pages: heading, intro and body all come
 * from Admin > Site Content. A line "{{name}}" in the body is replaced by
 * blocks[name] (e.g. the live odds table on the methodology page).
 */
export async function EditableLongPage({ slug, vars, blocks = {} }: { slug: LongPageSlug; vars?: TextVars; blocks?: Record<string, ReactNode> }) {
  const text = await getSiteText();
  const body = text.t(`page.${slug}.body`, vars);
  const intro = text.t(`page.${slug}.intro`);

  // Split the body around {{block}} lines, keeping the text in between.
  const parts: Array<{ text: string } | { block: string }> = [];
  let buffer: string[] = [];
  for (const raw of body.replace(/\r\n?/g, "\n").split("\n")) {
    const match = BLOCK_LINE.exec(raw.trim());
    if (match && match[1] in blocks) {
      parts.push({ text: buffer.join("\n") }, { block: match[1] });
      buffer = [];
    } else {
      buffer.push(raw);
    }
  }
  parts.push({ text: buffer.join("\n") });

  const faqs = slug === "faq" ? parseFaqText(body) : [];
  const outro = slug === "faq" ? text.t("page.faq.outro") : "";

  return (
    <LegalPage title={text.t(`page.${slug}.title`)} path={`/${slug}`} updated={text.pageUpdated(slug)} intro={intro ? <PlainContent text={intro} /> : undefined}>
      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs.map((f) => ({ question: f.question, answer: plainTextOf(f.answer) })))} />}
      {parts.map((part, i) => ("block" in part ? <div key={i}>{blocks[part.block]}</div> : <PlainContent key={i} text={part.text} prose headingIds />))}
      {outro && <PlainContent text={outro} prose />}
    </LegalPage>
  );
}

