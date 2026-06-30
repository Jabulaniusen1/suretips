"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

export async function getSignedProofUrl(path: string): Promise<string | null> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
