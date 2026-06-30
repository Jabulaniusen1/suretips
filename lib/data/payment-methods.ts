import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getPaymentMethodsForCountry(country: string): Promise<Tables<"payment_methods">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  return (data ?? []).filter((method) => method.countries.length === 0 || method.countries.includes(country));
}
