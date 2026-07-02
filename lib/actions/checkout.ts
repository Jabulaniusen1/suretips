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
  const country = (formData.get("country") as string) || undefined;
  const methodId = formData.get("methodId") as string;
  const methodName = formData.get("methodName") as string;
  const contactName = (formData.get("contactName") as string) || undefined;
  const contactEmail = (formData.get("contactEmail") as string) || undefined;
  const contactPhone = (formData.get("contactPhone") as string) || undefined;

  if (!planId || !amount || !currency || !methodId) throw new Error("Missing required fields.");

  // Identify the user if logged in (for attaching to the transaction record only)
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

  // Everyone uses the same code-based flow — no subscription row is created.
  // Admin confirms the proof, generates a 5-digit access code, and sends it
  // to the user. The user enters the code on the plan page to unlock access.
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: userId,
    plan_id: planId,
    amount,
    currency,
    payment_method_name: methodName,
    payment_type: "subscription",
    status: "pending",
    metadata: {
      payment_proof_url: path,
      duration_days: duration,
      country,
      payment_method_id: methodId,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
    },
  });
  if (txError) throw new Error(`Transaction error: ${txError.message}`);

  // Notify logged-in users (guests have no inbox)
  if (userId) {
    const { data: plan } = await supabase.from("plans").select("name").eq("id", planId).single();
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "payment_submitted",
      title: "Payment submitted",
      message: `Your payment for ${plan?.name ?? "your plan"} is pending review. Message support to receive your access code once confirmed.`,
    });
  }
}
