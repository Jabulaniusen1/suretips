"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

export async function updatePlan(
  id: string,
  input: {
    name: string;
    description: string;
    benefits: string[];
    is_active: boolean;
    requires_activation: boolean;
    max_predictions_per_day: number | null;
  }
) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("plans").update(input).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}`);
}

export async function togglePlanActive(id: string, isActive: boolean) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("plans").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plans");
}

export async function upsertPlanPrice(input: {
  plan_id: string;
  country: string;
  duration_days: 7 | 30;
  price: number;
  compare_at_price?: number | null;
  activation_fee?: number;
  currency: string;
}) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase
    .from("plan_prices")
    .upsert(input, { onConflict: "plan_id,country,duration_days" });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/plans/${input.plan_id}`);
}

export async function deletePlanPrice(id: string, planId: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("plan_prices").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/plans/${planId}`);
}
