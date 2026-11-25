import path from "node:path";
import type { NextConfig } from "next";

/**
 * Permanent redirects for retired and duplicate URLs. Every destination is
 * a final URL (no chains). Paid-product URLs go to the free tips page;
 * duplicate market pages go to their single canonical market page.
 */
const LEGACY_REDIRECTS: Array<[string, string]> = [
  // Retired subscription product
  ["/pricing", "/tips/free"],
  ["/subscriptions", "/tips/free"],
  ["/checkout", "/tips/free"],
  ["/vip", "/tips/free"],
  ["/vip/:path*", "/tips/free"],
  ["/plans/:slug", "/tips/free"],
  ["/dashboard/vip/:slug", "/tips/free"],
  ["/dashboard/winnings", "/previous-results"],
  ["/refund-policy", "/terms"],
  // Old filter-id URLs (underscores) and seeded duplicate SEO pages
  ["/tips/all", "/"],
  ["/tips/all-tips", "/"],
  ["/tips/safe-free-picks", "/tips/safe-picks"],
  ["/tips/super_single", "/tips/super-single"],
  ["/tips/double_chance", "/tips/double-chance"],
  ["/tips/home_win", "/tips/home-win"],
  ["/tips/away_win", "/tips/away-win"],
  ["/tips/over_1_5", "/tips/over-1-5"],
  ["/tips/over-1-5-goals", "/tips/over-1-5"],
  ["/tips/over_2_5", "/tips/over-2-5"],
  ["/tips/over-2-5-goals", "/tips/over-2-5"],
  ["/tips/btts-gg", "/tips/btts"],
];

/**
 * User accounts are turned off: only admins sign in, and the admin panel is
 * the only dashboard. Temporary (307) so they can be removed if accounts come
 * back -- see app/_dashboard/DISABLED.md and app/_signup/DISABLED.md.
 */
const ACCOUNT_REDIRECTS: Array<[string, string]> = [
  ["/dashboard", "/admin"],
  ["/dashboard/:path*", "/admin"],
  ["/signup", "/"],
];

/** www.<apex> -> <apex> when the canonical origin is the apex domain. */
function canonicalHostRedirects() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return [];
  let canonical: URL;
  try {
    canonical = new URL(raw);
  } catch {
    return [];
  }
  if (canonical.hostname === "localhost" || canonical.hostname.startsWith("www.")) return [];
  return [
    {
      source: "/:path*",
      has: [{ type: "host" as const, value: `www.${canonical.hostname}` }],
      destination: `${canonical.origin}/:path*`,
      statusCode: 301 as const,
    },
  ];
}

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase Storage (blog images) and API-Sports team/league logos.
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "media.api-sports.io" },
    ],
    // The logo is PNG now, so SVGs are not served through the optimiser.
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async redirects() {
    return [
      ...canonicalHostRedirects(),
      ...LEGACY_REDIRECTS.map(([source, destination]) => ({ source, destination, statusCode: 301 as const })),
      ...ACCOUNT_REDIRECTS.map(([source, destination]) => ({ source, destination, permanent: false })),
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
