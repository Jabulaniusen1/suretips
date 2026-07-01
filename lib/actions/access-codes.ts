"use server";

import { cookies } from "next/headers";
import { verifyAccessCode } from "@/lib/data/access-codes";

export async function activateAccessCode(
  code: string
): Promise<{ planSlug: string }> {
  const trimmed = code.trim().toUpperCase();
  if (!/^\d{5}$/.test(trimmed)) throw new Error("Code must be exactly 5 digits.");

  // We don't know the plan slug yet — search by code across all plans
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = createServiceClient();

  const { data: accessCode } = await supabase
    .from("access_codes")
    .select("*")
    .eq("code", trimmed)
    .eq("is_active", true)
    .single();

  if (!accessCode) throw new Error("Invalid access code.");
  if (new Date(accessCode.expires_at) < new Date()) throw new Error("This access code has expired.");

  const cookieStore = await cookies();
  cookieStore.set(`access_${accessCode.plan_slug}`, trimmed, {
    expires: new Date(accessCode.expires_at),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return { planSlug: accessCode.plan_slug };
}

export async function generateAccessCode(
  transactionId: string,
  planId: string,
  planSlug: string,
  durationDays: number
): Promise<string> {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = createServiceClient();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  let code: string;
  let attempts = 0;
  do {
    code = String(Math.floor(10000 + Math.random() * 90000));
    const { count } = await supabase
      .from("access_codes")
      .select("id", { count: "exact", head: true })
      .eq("code", code);
    if ((count ?? 0) === 0) break;
    attempts++;
  } while (attempts < 20);

  const { error } = await supabase.from("access_codes").insert({
    code,
    plan_id: planId,
    plan_slug: planSlug,
    duration_days: durationDays,
    expires_at: expiresAt.toISOString(),
    transaction_id: transactionId,
    is_active: true,
  });
  if (error) throw new Error(`Failed to create access code: ${error.message}`);

  return code;
}
