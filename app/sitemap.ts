import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = [
  "",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy",
  "/disclaimer",
  "/refund-policy",
  "/cookies",
  "/blog",
  "/competitions",
  "/previous-results",
  "/pricing",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const [{ data: posts }, { data: competitions }, { data: pages }] = await Promise.all([
    supabase.from("blog_posts").select("slug, updated_at").eq("published", true),
    supabase.from("competitions").select("slug").eq("status", "active"),
    supabase.from("custom_pages").select("slug").eq("is_published", true),
  ]);

  return [
    ...STATIC_ROUTES.map((route) => ({ url: `${SITE_URL}${route}`, lastModified: new Date() })),
    ...(posts ?? []).map((post) => ({ url: `${SITE_URL}/blog/${post.slug}`, lastModified: new Date(post.updated_at) })),
    ...(competitions ?? []).map((c) => ({ url: `${SITE_URL}/competitions/${c.slug}` })),
    ...(pages ?? []).map((p) => ({ url: `${SITE_URL}/tips/${p.slug}` })),
  ];
}
