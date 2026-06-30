"use server";

import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

async function notifyUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, title: string, message: string) {
  await supabase.from("notifications").insert({ user_id: userId, type: "payment_update", title, message });
}

export async function confirmSubscriptionPayment(transactionId: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { data: transaction, error } = await supabase.from("transactions").select("*").eq("id", transactionId).single();
  if (error || !transaction) throw new Error("Transaction not found");

  const { data: plan } = await supabase.from("plans").select("*").eq("id", transaction.plan_id).single();
  if (!plan) throw new Error("Plan not found");

  await supabase.from("transactions").update({ status: "completed" }).eq("id", transactionId);

  const durationDays = (transaction.metadata.duration_days ?? 30) as 7 | 30;

  if (plan.requires_activation) {
    await supabase
      .from("user_subscriptions")
      .update({ plan_status: "pending_activation", subscription_fee_paid: true })
      .eq("id", transaction.subscription_id!);
  } else {
    const now = new Date();
    await supabase
      .from("user_subscriptions")
      .update({
        plan_status: "active",
        subscription_fee_paid: true,
        start_date: now.toISOString(),
        expiry_date: addDays(now, durationDays).toISOString(),
      })
      .eq("id", transaction.subscription_id!);
  }

  await notifyUser(
    supabase,
    transaction.user_id,
    "Payment confirmed",
    plan.requires_activation
      ? `Your ${plan.name} subscription payment has been confirmed. Pay the activation fee to unlock predictions.`
      : `Your ${plan.name} subscription is now active. Enjoy your predictions!`
  );

  revalidatePath("/admin/transactions");
  revalidatePath("/dashboard");
}

export async function confirmActivationPayment(transactionId: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { data: transaction, error } = await supabase.from("transactions").select("*").eq("id", transactionId).single();
  if (error || !transaction || transaction.payment_type !== "activation") throw new Error("Invalid transaction");

  const { data: plan } = await supabase.from("plans").select("*").eq("id", transaction.plan_id).single();

  await supabase.from("transactions").update({ status: "completed" }).eq("id", transactionId);

  const durationDays = (transaction.metadata.duration_days ?? 30) as 7 | 30;
  const now = new Date();

  await supabase
    .from("user_subscriptions")
    .update({
      plan_status: "active",
      activation_fee_paid: true,
      start_date: now.toISOString(),
      expiry_date: addDays(now, durationDays).toISOString(),
    })
    .eq("id", transaction.subscription_id!);

  await notifyUser(
    supabase,
    transaction.user_id,
    "Activation confirmed",
    `Your ${plan?.name ?? "plan"} access is fully unlocked. Enjoy your predictions!`
  );

  revalidatePath("/admin/transactions");
  revalidatePath("/dashboard");
}

export async function rejectTransaction(transactionId: string, reason: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const supabase = await createClient();
  const { data: transaction, error } = await supabase.from("transactions").select("*").eq("id", transactionId).single();
  if (error || !transaction) throw new Error("Transaction not found");

  const { data: plan } = await supabase.from("plans").select("*").eq("id", transaction.plan_id).single();

  await supabase
    .from("transactions")
    .update({ status: "failed", metadata: { ...transaction.metadata, rejection_reason: reason } })
    .eq("id", transactionId);

  if (transaction.payment_type === "subscription" && transaction.subscription_id) {
    await supabase
      .from("user_subscriptions")
      .update({ plan_status: "inactive", subscription_fee_paid: false })
      .eq("id", transaction.subscription_id);
  }

  await notifyUser(
    supabase,
    transaction.user_id,
    "Payment rejected",
    `Your payment for ${plan?.name ?? "your plan"} could not be verified. Reason: ${reason || "Not specified"}. Please try again or contact support.`
  );

  revalidatePath("/admin/transactions");
  revalidatePath("/dashboard");
}
