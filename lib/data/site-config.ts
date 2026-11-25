import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export interface SiteConfig {
  telegram_url: string;
  whatsapp_number: string;
  contact_email: string;
  support_link: string;
  social_links: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
}

// Empty defaults: links and contact details only render once an admin has
// set real values in /admin/config. Never ship placeholder contact details.
const DEFAULTS: SiteConfig = {
  telegram_url: "",
  whatsapp_number: "",
  contact_email: "",
  support_link: "",
  social_links: {},
};

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const { data, error } = await createPublicClient().from("site_config").select("key, value");
  if (error) console.error(`[site-config] ${error.message}`);

  const map = new Map<string, unknown>(data?.map((row) => [row.key, row.value]) ?? []);
  const social = (map.get("social_links") ?? {}) as Record<string, unknown>;

  return {
    telegram_url: asString(map.get("telegram_url"), DEFAULTS.telegram_url),
    whatsapp_number: asString(map.get("whatsapp_number"), DEFAULTS.whatsapp_number),
    contact_email: asString(map.get("contact_email"), DEFAULTS.contact_email),
    support_link: asString(map.get("support_link"), DEFAULTS.support_link),
    social_links: {
      facebook: asString(social.facebook, ""),
      twitter: asString(social.twitter, ""),
      instagram: asString(social.instagram, ""),
      youtube: asString(social.youtube, ""),
    },
  };
});

/** Configured social profile URLs, for Organization `sameAs`. */
export function socialProfileUrls(config: SiteConfig): string[] {
  return [config.telegram_url, ...Object.values(config.social_links)].filter((url): url is string =>
    Boolean(url && /^https:\/\//.test(url))
  );
}
