import { createServiceClient } from "@/lib/supabase/service";
import type { Tables } from "@/types/database";

export async function verifyAccessCode(
  code: string,
  planSlug: string
): Promise<Tables<"access_codes"> | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("access_codes")
    .select("*")
    .eq("code", code)
    .eq("plan_slug", planSlug)
    .eq("is_active", true)
    .single();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  return data;
}

export async function getAccessCodeByTransactionId(
  transactionId: string
): Promise<Tables<"access_codes"> | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("access_codes")
    .select("*")
    .eq("transaction_id", transactionId)
    .maybeSingle();
  return data;
}
