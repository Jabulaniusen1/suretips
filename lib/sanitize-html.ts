// Allowlist sanitiser for admin-authored rich text (TipTap output) before it
// is rendered with dangerouslySetInnerHTML. Only admins can write blog
// content (enforced by RLS), so this is defence in depth: a compromised admin
// account or a pasted snippet must not be able to inject script.
//
// Strategy: drop dangerous elements with their content, drop comments,
// rebuild every remaining tag from an allowlist of tags and attributes, and
// only allow safe URL schemes.

const DROP_WITH_CONTENT = ["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math", "form", "textarea", "select", "button"];

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "mark", "sub", "sup",
  "a", "ul", "ol", "li", "blockquote", "code", "pre", "span", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  td: new Set(["colspan", "rowspan"]),
  "*": new Set(["style"]),
};

const ALLOWED_STYLE_PROPS = new Set(["color", "text-align", "font-family", "font-weight", "font-style", "text-decoration"]);

const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function escapeAttr(value: string): string {
  return value.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&colon;/gi, ":")
    .replace(/&tab;/gi, "\t")
    .replace(/&newline;/gi, "\n");
}

export function isSafeUrl(raw: string, kind: "link" | "image"): boolean {
  // Strip whitespace/control characters browsers ignore inside schemes ("java\nscript:").
  const value = decodeEntities(raw).replace(/[\u0000-\u0020\u007f-\u009f]/g, "").toLowerCase();
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("#")) return kind === "link";
  if (value.startsWith("https://") || value.startsWith("http://")) return true;
  if (value.startsWith("mailto:")) return kind === "link";
  return false;
}

function sanitizeStyle(style: string): string | null {
  const declarations = style
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const idx = d.indexOf(":");
      if (idx < 1) return null;
      const prop = d.slice(0, idx).trim().toLowerCase();
      const value = d.slice(idx + 1).trim();
      if (!ALLOWED_STYLE_PROPS.has(prop)) return null;
      if (/[<>"\\]|url\s*\(|expression\s*\(|@import|javascript:/i.test(value)) return null;
      return `${prop}: ${value}`;
    })
    .filter((d): d is string => d !== null);
  return declarations.length > 0 ? declarations.join("; ") : null;
}

function sanitizeTag(tag: string, attrSource: string, closing: boolean): string {
  if (closing) return `</${tag}>`;

  const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
  const out: string[] = [];
  let external = false;
  let hasTarget = false;

  for (const match of attrSource.matchAll(ATTR_RE)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (name.startsWith("on")) continue;
    if (!allowed.has(name) && !ALLOWED_ATTRS["*"].has(name)) continue;

    if (name === "href") {
      if (!isSafeUrl(value, "link")) continue;
      external = /^https?:\/\//i.test(value.trim());
    }
    if (name === "src" && !isSafeUrl(value, "image")) continue;
    if (name === "style") {
      const style = sanitizeStyle(value);
      if (style) out.push(`style="${escapeAttr(style)}"`);
      continue;
    }
    if (name === "target") {
      if (value !== "_blank") continue;
      hasTarget = true;
    }
    if (name === "rel") continue; // rebuilt below
    if ((name === "width" || name === "height" || name === "colspan" || name === "rowspan") && !/^\d{1,4}$/.test(value)) continue;
    out.push(`${name}="${escapeAttr(value)}"`);
  }

  if (tag === "a" && (external || hasTarget)) out.push('rel="noopener noreferrer nofollow"');
  if (tag === "img") {
    // An image whose src was unsafe (or missing) would render as a broken box.
    if (!out.some((a) => a.startsWith("src="))) return "";
    if (!out.some((a) => a.startsWith("alt="))) out.push('alt=""');
    out.push('loading="lazy" decoding="async"');
  }

  return `<${tag}${out.length ? ` ${out.join(" ")}` : ""}>`;
}

export function sanitizeHtml(html: string): string {
  let result = html.replace(/<!--[\s\S]*?-->/g, "");
  for (const tag of DROP_WITH_CONTENT) {
    result = result.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, "gi"), "");
    result = result.replace(new RegExp(`<${tag}\\b[^>]*>`, "gi"), "");
  }

  return result.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)\s*\/?>|<|>/g, (full, slash: string, rawTag: string, attrs: string) => {
    if (full === "<") return "&lt;";
    if (full === ">") return "&gt;";
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    return sanitizeTag(tag, attrs ?? "", slash === "/");
  });
}
