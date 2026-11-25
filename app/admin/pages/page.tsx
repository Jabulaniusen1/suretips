import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CustomPagesManager } from "@/components/admin/custom-pages-manager";

export const metadata: Metadata = { title: "SEO pages" };

export default async function AdminPagesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("custom_pages").select("*").order("footer_order");

  return (
    <div>
      <h1 className="text-xl font-bold">SEO Pages</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Extra landing pages at /tips/[slug] for search intents the built-in market pages don&apos;t cover. Check the keyword map in
        lib/seo/market-pages.ts first — two pages targeting the same query compete with each other. Pages are only indexed once
        they have enough original content.
      </p>
      <div className="mt-4">
        <CustomPagesManager pages={data ?? []} />
      </div>
    </div>
  );
}
