"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";
import type { Tables } from "@/types/database";

export type VipWinningInput = {
  plan_id: string;
  league?: string;
  home_team: string;
  away_team: string;
  prediction_type: string;
  home_score?: number;
  away_score?: number;
  result: Tables<"vip_winnings">["result"];
  date: string;
};

export async function createVipWinning(input: VipWinningInput) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("vip_winnings").insert(input);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/vip-wins");
  revalidatePath("/");
}

export async function deleteVipWinning(id: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { error } = await supabase.from("vip_winnings").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/vip-wins");
  revalidatePath("/");
}
