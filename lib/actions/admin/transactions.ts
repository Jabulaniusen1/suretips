"use server";

import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";
import { generateAccessCode } from "@/lib/actions/access-codes";

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

  const durationDays = (transaction.metadata.duration_days ?? 30) as number;

  // Generate access code — this is the only access mechanism now (same for
  // guests and logged-in users). The admin copies it from the transactions
  // table and sends it to the user manually.
  const code = await generateAccessCode(transactionId, plan.id, plan.slug, durationDays);

  if (transaction.user_id) {
    await notifyUser(
      supabase,
      transaction.user_id,
      "Payment confirmed — your access code is ready",
      `Your payment for ${plan.name} has been confirmed. Your access code is: ${code}. Go to /plans/${plan.slug} and enter it to unlock your predictions.`
    );
  }

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

  const durationDays = (transaction.metadata.duration_days ?? 30) as number;
  const now = new Date();

  if (transaction.subscription_id) {
    await supabase
      .from("user_subscriptions")
      .update({
        plan_status: "active",
        activation_fee_paid: true,
        start_date: now.toISOString(),
        expiry_date: addDays(now, durationDays).toISOString(),
      })
      .eq("id", transaction.subscription_id);
  }

  // Also generate an access code for activation payments
  if (plan) {
    await generateAccessCode(transactionId, plan.id, plan.slug, durationDays);
  }

  if (transaction.user_id) {
    await notifyUser(
      supabase,
      transaction.user_id,
      "Activation confirmed",
      `Your ${plan?.name ?? "plan"} access is fully unlocked. Enjoy your predictions!`
    );
  }

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

  if (transaction.user_id) {
    await notifyUser(
      supabase,
      transaction.user_id,
      "Payment rejected",
      `Your payment for ${plan?.name ?? "your plan"} could not be verified. Reason: ${reason || "Not specified"}. Please try again or contact support.`
    );
  }

  revalidatePath("/admin/transactions");
  revalidatePath("/dashboard");
}
