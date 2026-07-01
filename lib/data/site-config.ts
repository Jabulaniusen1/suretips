import { createClient } from "@/lib/supabase/server";

export interface SiteConfig {
  hero: {
    headline: string;
    subtext: string;
    primary_cta_label: string;
    secondary_cta_label: string;
  };
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

const DEFAULTS: SiteConfig = {
  hero: {
    headline: "Sureodds Predict",
    subtext: "Accurate, transparent football predictions backed by proof.",
    primary_cta_label: "Subscribe to VIP",
    secondary_cta_label: "Join Telegram",
  },
  telegram_url: "https://t.me/sureoddspredict",
  whatsapp_number: "",
  contact_email: "support@sureoddspredict.com",
  support_link: "",
  social_links: {},
};

export async function getSiteConfig(): Promise<SiteConfig> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_config").select("key, value");

  const map = new Map(data?.map((row) => [row.key, row.value]) ?? []);

  return {
    hero: { ...DEFAULTS.hero, ...(map.get("hero") as unknown as Partial<SiteConfig["hero"]>) },
    telegram_url: (map.get("telegram_url") as unknown as string) ?? DEFAULTS.telegram_url,
    whatsapp_number: (map.get("whatsapp_number") as unknown as string) ?? DEFAULTS.whatsapp_number,
    contact_email: (map.get("contact_email") as unknown as string) ?? DEFAULTS.contact_email,
    support_link: (map.get("support_link") as unknown as string) ?? DEFAULTS.support_link,
    social_links: {
      ...DEFAULTS.social_links,
      ...(map.get("social_links") as unknown as SiteConfig["social_links"]),
    },
  };
}
