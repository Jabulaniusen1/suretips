import type { Metadata } from "next";
import { siteOrigin } from "@/lib/env";
import { stripBrandSuffix } from "@/lib/seo/market-pages";

// Central metadata + structured data helpers. Every public page builds its
// metadata through `pageMetadata` so canonical URLs, Open Graph and Twitter
// tags stay consistent, and all JSON-LD comes from the builders below.

export const SITE_NAME = "Sure Match Tips";
export const SITE_DESCRIPTION =
  "Free football predictions, daily betting tips by market, match previews with head-to-head and form data, and a transparent record of every published result.";
export const SITE_LOCALE = "en_GB";

/** Absolute URL on the canonical origin. Accepts paths or absolute URLs. */
export function absoluteUrl(pathOrUrl = "/"): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteOrigin()}${path === "/" ? "" : path}` || siteOrigin();
}

/** Default social image -- a branded card rendered by app/og/route.tsx. */
export function defaultOgImage(title?: string): { url: string; width: number; height: number; alt: string } {
  const url = title ? `/og?title=${encodeURIComponent(title.slice(0, 120))}` : "/og";
  return { url, width: 1200, height: 630, alt: title ? `${title} – ${SITE_NAME}` : SITE_NAME };
}

export interface PageMetadataOptions {
  /** Page title without the brand -- the root layout template appends it. */
  title: string;
  /** Full title that bypasses the template (used by the homepage). */
  absoluteTitle?: string;
  description: string;
  /** Canonical path, e.g. "/tips/btts". */
  path: string;
  image?: { url: string; alt?: string; width?: number; height?: number } | null;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** noindex, follow -- for thin, filtered or duplicate views. */
  noIndex?: boolean;
  /** Rendered as <meta name="keywords"> when non-empty. */
  keywords?: string[];
}

/** Max keywords kept from an editor's list. */
const MAX_KEYWORDS = 20;

/**
 * Parses an editor's comma-separated keyword list: trims, drops empties and
 * case-insensitive duplicates, and caps the count.
 */
export function parseKeywords(value: string | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of (value ?? "").split(/[,\n]/)) {
    const keyword = raw.replace(/\s+/g, " ").trim();
    if (!keyword || seen.has(keyword.toLowerCase())) continue;
    seen.add(keyword.toLowerCase());
    out.push(keyword);
    if (out.length >= MAX_KEYWORDS) break;
  }
  return out;
}

export function pageMetadata(options: PageMetadataOptions): Metadata {
  const { absoluteTitle, description, path, type = "website", noIndex, keywords } = options;
  // The layout template appends the brand; drop one typed by an editor
  // ("… | Sure Match Tips") so it never appears twice.
  const title = stripBrandSuffix(options.title);
  const socialTitle = absoluteTitle ?? title;
  const image = options.image ?? defaultOgImage(socialTitle);
  const images = [{ url: image.url, alt: image.alt ?? socialTitle, width: image.width, height: image.height }];

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      title: socialTitle,
      description,
      images,
      ...(type === "article" && options.publishedTime ? { publishedTime: options.publishedTime } : {}),
      ...(type === "article" && options.modifiedTime ? { modifiedTime: options.modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image.url],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
  };
}

/** Trims to a meta-description-friendly length on a word boundary. */
export function truncateDescription(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\-–]+$/, "")}…`;
}

/** Plain text from stored HTML (blog content, admin rich text). */
export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// JSON-LD builders. Only describe what is visible on the page.
// ---------------------------------------------------------------------------

type JsonLd = Record<string, unknown>;

export function organizationId(): string {
  return `${siteOrigin()}/#organization`;
}

function publisher(): JsonLd {
  return {
    "@type": "Organization",
    "@id": organizationId(),
    name: SITE_NAME,
    url: siteOrigin(),
    // Search engines show this on white, so use the navy wordmark.
    logo: { "@type": "ImageObject", url: absoluteUrl("/logo-on-light.png"), width: 1000, height: 506 },
  };
}

export function organizationJsonLd(sameAs: string[] = []): JsonLd {
  return {
    "@context": "https://schema.org",
    ...publisher(),
    description: SITE_DESCRIPTION,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteOrigin()}/#website`,
    name: SITE_NAME,
    url: siteOrigin(),
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": organizationId() },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>): JsonLd | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function itemListJsonLd(name: string, items: Array<{ name: string; path: string }>): JsonLd | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

export function blogPostingJsonLd(options: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
  authorName?: string | null;
  image?: string | null;
  section?: string | null;
  keywords?: string[];
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: options.title.slice(0, 110),
    description: options.description,
    url: absoluteUrl(options.path),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(options.path) },
    datePublished: options.datePublished,
    dateModified: options.dateModified,
    author: options.authorName
      ? { "@type": "Person", name: options.authorName }
      : { "@type": "Organization", "@id": organizationId(), name: SITE_NAME, url: siteOrigin() },
    publisher: publisher(),
    ...(options.image ? { image: [absoluteUrl(options.image)] } : {}),
    ...(options.section ? { articleSection: options.section } : {}),
    ...(options.keywords && options.keywords.length > 0 ? { keywords: options.keywords.join(", ") } : {}),
    inLanguage: "en",
  };
}

const EVENT_STATUS: Record<string, string> = {
  PST: "https://schema.org/EventPostponed",
  CANC: "https://schema.org/EventCancelled",
  ABD: "https://schema.org/EventCancelled",
};

export function sportsEventJsonLd(options: {
  name: string;
  description: string;
  path: string;
  startDate: string;
  statusShort?: string;
  venue?: { name: string | null; city: string | null } | null;
  homeTeam: { name: string; logo?: string | null };
  awayTeam: { name: string; logo?: string | null };
  competition?: string | null;
}): JsonLd {
  const team = (t: { name: string; logo?: string | null }) => ({
    "@type": "SportsTeam",
    name: t.name,
    sport: "Soccer",
    ...(t.logo ? { logo: absoluteUrl(t.logo) } : {}),
  });

  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    sport: "Soccer",
    startDate: options.startDate,
    eventStatus: (options.statusShort && EVENT_STATUS[options.statusShort]) || "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    homeTeam: team(options.homeTeam),
    awayTeam: team(options.awayTeam),
    competitor: [team(options.homeTeam), team(options.awayTeam)],
    ...(options.venue?.name
      ? {
          location: {
            "@type": "Place",
            name: options.venue.name,
            ...(options.venue.city ? { address: { "@type": "PostalAddress", addressLocality: options.venue.city } } : {}),
          },
        }
      : {}),
    ...(options.competition ? { superEvent: { "@type": "SportsEvent", name: options.competition } } : {}),
  };
}
