import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AdLinksManager } from "@/components/admin/ad-links-manager";

export const metadata: Metadata = { title: "Ad Links" };

export default async function AdminAdLinksPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("ad_links").select("*").order("display_order");

  return (
    <div>
      <h1 className="text-xl font-bold">Ad Links</h1>
      <div className="mt-4">
        <AdLinksManager links={data ?? []} />
      </div>
    </div>
  );
}
