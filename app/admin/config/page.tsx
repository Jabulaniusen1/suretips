import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/data/site-config";
import { SiteConfigForm } from "@/components/admin/site-config-form";

export const metadata: Metadata = { title: "Links & Contact" };

export default async function AdminConfigPage() {
  const config = await getSiteConfig();

  return (
    <div>
      <h1 className="text-xl font-bold">Links &amp; Contact</h1>
      <p className="mt-1 text-sm text-muted-foreground">Telegram, WhatsApp, email, support and social links shown across the site. Wording (button labels, headings, page text) is in Site Content.</p>
      <div className="mt-4">
        <SiteConfigForm config={config} />
      </div>
    </div>
  );
}
