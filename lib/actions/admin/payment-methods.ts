"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";
import type { Tables } from "@/types/database";

export type PaymentMethodInput = {
  name: string;
  type: Tables<"payment_methods">["type"];
  currency: string;
  details: Record<string, unknown>;
  countries: string[];
  is_active: boolean;
  display_order: number;
};

export async function createPaymentMethod(input: PaymentMethodInput) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").insert(input);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/payment-methods");
}

export async function updatePaymentMethod(id: string, input: PaymentMethodInput) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").update(input).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/payment-methods");
}

export async function deletePaymentMethod(id: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/payment-methods");
}
