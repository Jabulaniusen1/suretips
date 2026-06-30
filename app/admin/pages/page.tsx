import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CustomPagesManager } from "@/components/admin/custom-pages-manager";

export const metadata: Metadata = { title: "Pages" };

export default async function AdminPagesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("custom_pages").select("*").order("footer_order");

  return (
    <div>
      <h1 className="text-xl font-bold">SEO Pages</h1>
      <p className="mt-1 text-sm text-muted-foreground">Programmatic landing pages at /tips/[slug], optionally linked in the footer.</p>
      <div className="mt-4">
        <CustomPagesManager pages={data ?? []} />
      </div>
    </div>
  );
}
