import Link from "next/link";
import { cn } from "@/lib/utils";
import { parseInline, parsePlainText, plainTextOf } from "@/lib/content/plain-text";

/** "How results are verified" -> "how-results-are-verified" (for #anchors). */
export function headingId(text: string): string {
  return plainTextOf(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Renders admin-entered plain text safely (no HTML is interpreted). See
 * lib/content/plain-text.ts for the supported formatting: paragraphs, "## " /
 * "### " sub-headings, "- " and "1. " lists, **bold** and [links](/path).
 */
export function PlainContent({
  text,
  className,
  headingIds = false,
  prose = false,
}: {
  text: string;
  className?: string;
  /** Give headings ids (slug of their text) so they can be linked to. */
  headingIds?: boolean;
  /** Unstyled elements, for use inside a Tailwind Typography "prose" container. */
  prose?: boolean;
}) {
  const blocks = parsePlainText(text);
  if (blocks.length === 0) return null;
  if (prose) return <ProseBlocks blocks={blocks} headingIds={headingIds} />;

  return (
    <div className={cn("[overflow-wrap:anywhere]", className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={i} id={headingIds ? headingId(block.text) : undefined} className="mt-8 scroll-mt-24 text-lg font-bold text-foreground first:mt-0">
                <Inline text={block.text} />
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} id={headingIds ? headingId(block.text) : undefined} className="mt-6 scroll-mt-24 font-semibold text-foreground first:mt-0">
                <Inline text={block.text} />
              </h3>
            );
          case "ul":
          case "ol": {
            const ListTag = block.type;
            return (
              <ListTag key={i} className={`mt-3 space-y-1 pl-5 first:mt-0 ${block.type === "ul" ? "list-disc" : "list-decimal"}`}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ListTag>
            );
          }
          default:
            return (
              <p key={i} className="mt-3 first:mt-0">
                <Inline text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}

function ProseBlocks({ blocks, headingIds }: { blocks: ReturnType<typeof parsePlainText>; headingIds: boolean }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "h2" || block.type === "h3") {
          const Tag = block.type;
          return (
            <Tag key={i} id={headingIds ? headingId(block.text) : undefined} className="scroll-mt-24">
              <Inline text={block.text} plain />
            </Tag>
          );
        }
        if ("items" in block) {
          const ListTag = block.type;
          return (
            <ListTag key={i}>
              {block.items.map((item, j) => (
                <li key={j}>
                  <Inline text={item} plain />
                </li>
              ))}
            </ListTag>
          );
        }
        return (
          <p key={i}>
            <Inline text={block.text} plain />
          </p>
        );
      })}
    </>
  );
}

/** One line of admin text: **bold** and [links](/path), no paragraphs. */
export function InlineContent({ text }: { text: string }) {
  return <Inline text={text} />;
}

function Inline({ text, plain = false }: { text: string; plain?: boolean }) {
  return (
    <>
      {parseInline(text).map((segment, i) => {
        if (segment.type === "bold") {
          return (
            <strong key={i} className={plain ? undefined : "font-semibold text-foreground"}>
              {segment.text}
            </strong>
          );
        }
        if (segment.type === "link") {
          return segment.external ? (
            <a key={i} href={segment.href} rel="nofollow noopener noreferrer" className={plain ? undefined : "font-medium text-brand hover:underline"}>
              {segment.text}
            </a>
          ) : (
            <Link key={i} href={segment.href} className={plain ? undefined : "font-medium text-brand hover:underline"}>
              {segment.text}
            </Link>
          );
        }
        return segment.text;
      })}
    </>
  );
}
