import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/env";

// Crawl rules only -- private areas are protected by authentication, and
// non-indexable public views use `noindex` metadata. Robots must not block
// anything a public page needs to render (/_next assets, images, /og).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/dashboard", "/login", "/signup"],
      },
    ],
    sitemap: `${siteOrigin()}/sitemap.xml`,
    host: siteOrigin(),
  };
}
