"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function submitCheckout(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Please upload your proof of payment.");

  const planId = formData.get("planId") as string;
  const amount = Number(formData.get("amount"));
  const currency = formData.get("currency") as string;
  const duration = Number(formData.get("duration")) as 7 | 30;
  const methodId = formData.get("methodId") as string;
  const methodName = formData.get("methodName") as string;
  const contactName = (formData.get("contactName") as string) || undefined;
  const contactEmail = (formData.get("contactEmail") as string) || undefined;
  const contactPhone = (formData.get("contactPhone") as string) || undefined;

  if (!planId || !amount || !currency || !methodId) throw new Error("Missing required fields.");

  // Determine if a user is logged in
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  const userId = user?.id ?? null;

  // All storage and DB writes go through the service client so guests can
  // upload without a Supabase auth session.
  const supabase = createServiceClient();

  const fileExt = file.name.split(".").pop() ?? "jpg";
  const folder = userId ?? "guest";
  const path = `${folder}/${crypto.randomUUID()}.${fileExt}`;

  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, bytes, { contentType: file.type });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  // Create subscription row only for logged-in users
  let subscriptionId: string | undefined;
  if (userId) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_id: planId,
          plan_status: "pending",
          subscription_fee_paid: false,
          activation_fee_paid: false,
        },
        { onConflict: "user_id,plan_id" }
      )
      .select("id")
      .single();
    subscriptionId = sub?.id;
  }

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: userId,
    subscription_id: subscriptionId ?? null,
    plan_id: planId,
    amount,
    currency,
    payment_method_name: methodName,
    payment_type: "subscription",
    status: "pending",
    metadata: {
      payment_proof_url: path,
      duration_days: duration,
      payment_method_id: methodId,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
    },
  });
  if (txError) throw new Error(`Transaction error: ${txError.message}`);

  // Notify logged-in users only (guests have no notification inbox)
  if (userId) {
    const { data: plan } = await supabase.from("plans").select("name").eq("id", planId).single();
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "payment_submitted",
      title: "Payment submitted",
      message: `Your subscription payment for ${plan?.name ?? "your plan"} is pending review.`,
    });
  }
}
