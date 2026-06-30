import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/data/site-config";
import { SiteConfigForm } from "@/components/admin/site-config-form";

export const metadata: Metadata = { title: "Site Config" };

export default async function AdminConfigPage() {
  const config = await getSiteConfig();

  return (
    <div>
      <h1 className="text-xl font-bold">Site Config</h1>
      <p className="mt-1 text-sm text-muted-foreground">Hero copy, contact details, and social links shown across the site.</p>
      <div className="mt-4">
        <SiteConfigForm config={config} />
      </div>
    </div>
  );
}
