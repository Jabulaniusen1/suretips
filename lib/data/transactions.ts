import { createClient } from "@/lib/supabase/server";

export interface TransactionRow {
  id: string;
  user_id: string | null;
  plan_id: string;
  amount: number;
  currency: string;
  payment_method_name: string | null;
  payment_type: "subscription" | "activation";
  status: "pending" | "completed" | "failed" | "refunded";
  metadata: {
    payment_proof_url?: string;
    duration_days?: 7 | 30;
    rejection_reason?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
  };
  created_at: string;
  users: { full_name: string | null; email: string } | null;
  plans: { name: string; slug: string } | null;
  access_codes: { code: string; expires_at: string } | null;
}

const SELECT = "*, users(full_name, email), plans(name, slug), access_codes(code, expires_at)";

export async function getPendingSubscriptionTransactions(): Promise<TransactionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select(SELECT)
    .eq("status", "pending")
    .eq("payment_type", "subscription")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as TransactionRow[];
}

export async function getPendingActivationTransactions(): Promise<TransactionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select(SELECT)
    .eq("status", "pending")
    .eq("payment_type", "activation")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as TransactionRow[];
}

export async function getAllTransactions(limit = 50): Promise<TransactionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("transactions").select(SELECT).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as unknown as TransactionRow[];
}
