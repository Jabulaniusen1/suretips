// Parser for admin-entered plain text (SEO page body, competition content,
// introductions). It never interprets HTML: the output is a list of blocks and
// inline segments that components render as React elements.
//
// Supported, line by line:
//   blank line              ends a paragraph or list
//   "## Heading"            sub-heading (h2); "### Heading" is an h3. A single
//                           "# " is treated as h2 -- the page already has an h1.
//   "- item", "* item",     bullet list (also "•" and "–", as pasted from
//   "• item"                Word / Google Docs)
//   "1. item", "1) item"    numbered list
//   anything else           paragraph text; consecutive lines join with a space
// Inline, inside any block:
//   **bold**
//   [link text](/internal/path) or [link text](https://example.com)

export type InlineSegment =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "link"; text: string; href: string; external: boolean };

export type PlainBlock =
  | { type: "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul" | "ol"; items: string[] };

const HEADING_RE = /^(#{1,3})\s+(.+?)\s*#*\s*$/;
const BULLET_RE = /^[-*•–]\s+(.+)$/;
const NUMBERED_RE = /^\d{1,3}[.)]\s+(.+)$/;

export function parsePlainText(input: string): PlainBlock[] {
  const lines = input
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .split("\n")
    .map((l) => l.replace(/\t/g, " ").trim());

  const blocks: PlainBlock[] = [];
  let paragraph: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join(" ") });
    paragraph = [];
  };
  const flushList = () => {
    if (list && list.items.length) blocks.push(list);
    list = null;
  };

  for (const line of lines) {
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: heading[1].length === 3 ? "h3" : "h2", text: heading[2] });
      continue;
    }

    const bullet = BULLET_RE.exec(line);
    const numbered = bullet ? null : NUMBERED_RE.exec(line);
    if (bullet || numbered) {
      const type = bullet ? "ul" : "ol";
      flushParagraph();
      if (list && list.type !== type) flushList();
      list ??= { type, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

const INLINE_RE = /\*\*(.+?)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/** Internal paths ("/tips/btts") and absolute http(s) URLs only. */
export function safeLinkHref(href: string): { href: string; external: boolean } | null {
  const value = href.trim();
  if (/^\/(?!\/)[^\s]*$/.test(value)) return { href: value, external: false };
  if (/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value)) return { href: value, external: true };
  return null;
}

export function parseInline(text: string): InlineSegment[] {
  const out: InlineSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    const index = m.index ?? 0;
    if (index > last) out.push({ type: "text", text: text.slice(last, index) });
    if (m[1] !== undefined) {
      out.push({ type: "bold", text: m[1] });
    } else {
      const link = safeLinkHref(m[3]);
      out.push(link ? { type: "link", text: m[2], ...link } : { type: "text", text: m[2] });
    }
    last = index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

/** Text with inline markers removed -- for length checks and meta descriptions. */
export function plainTextOf(input: string): string {
  return parsePlainText(input)
    .flatMap((b) => ("items" in b ? b.items : [b.text]))
    .map((t) => parseInline(t).map((s) => s.text).join(""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
