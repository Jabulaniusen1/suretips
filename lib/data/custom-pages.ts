import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getFooterCustomPages(): Promise<Tables<"custom_pages">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("custom_pages")
    .select("*")
    .eq("is_published", true)
    .eq("show_in_footer", true)
    .order("footer_order");

  return data ?? [];
}

export async function getCustomPageBySlug(slug: string): Promise<Tables<"custom_pages"> | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("custom_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return data;
}
