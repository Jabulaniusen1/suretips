import Link from "next/link";
import { cn } from "@/lib/utils";
import { parseInline, parsePlainText } from "@/lib/content/plain-text";

/**
 * Renders admin-entered plain text safely (no HTML is interpreted). See
 * lib/content/plain-text.ts for the supported formatting: paragraphs, "## " /
 * "### " sub-headings, "- " and "1. " lists, **bold** and [links](/path).
 */
export function PlainContent({ text, className }: { text: string; className?: string }) {
  const blocks = parsePlainText(text);
  if (blocks.length === 0) return null;

  return (
    <div className={cn("[overflow-wrap:anywhere]", className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={i} className="mt-8 text-lg font-bold text-foreground first:mt-0">
                <Inline text={block.text} />
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mt-6 font-semibold text-foreground first:mt-0">
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

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((segment, i) => {
        if (segment.type === "bold") {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {segment.text}
            </strong>
          );
        }
        if (segment.type === "link") {
          return segment.external ? (
            <a key={i} href={segment.href} rel="nofollow noopener noreferrer" className="font-medium text-brand hover:underline">
              {segment.text}
            </a>
          ) : (
            <Link key={i} href={segment.href} className="font-medium text-brand hover:underline">
              {segment.text}
            </Link>
          );
        }
        return segment.text;
      })}
    </>
  );
}
