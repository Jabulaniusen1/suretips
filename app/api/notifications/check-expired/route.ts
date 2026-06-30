import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  let expired = 0;
  let reminded = 0;

  const { data: expiring } = await supabase
    .from("user_subscriptions")
    .select("*, users(email, full_name), plans(name)")
    .eq("plan_status", "active")
    .not("expiry_date", "is", null)
    .lte("expiry_date", now.toISOString());

  for (const sub of expiring ?? []) {
    const user = (sub as unknown as { users: { email: string; full_name: string | null } | null }).users;
    const plan = (sub as unknown as { plans: { name: string } | null }).plans;

    await supabase.from("user_subscriptions").update({ plan_status: "expired" }).eq("id", sub.id);

    await supabase.from("notifications").insert({
      user_id: sub.user_id,
      type: "subscription_expired",
      title: "Subscription expired",
      message: `Your ${plan?.name ?? "subscription"} has expired. Renew to keep getting predictions.`,
    });

    if (user?.email) {
      await sendEmail(
        user.email,
        "Your Sureodds Predict subscription has expired",
        `<p>Hi ${user.full_name ?? "there"},</p><p>Your <strong>${plan?.name ?? "subscription"}</strong> has expired. Renew from your dashboard to keep receiving predictions.</p>`
      );
    }

    expired += 1;
  }

  const { data: expiringSoon } = await supabase
    .from("user_subscriptions")
    .select("*, users(email, full_name), plans(name)")
    .eq("plan_status", "active")
    .is("expiry_reminder_sent_at", null)
    .not("expiry_date", "is", null)
    .gt("expiry_date", now.toISOString())
    .lte("expiry_date", in24h.toISOString());

  for (const sub of expiringSoon ?? []) {
    const user = (sub as unknown as { users: { email: string; full_name: string | null } | null }).users;
    const plan = (sub as unknown as { plans: { name: string } | null }).plans;

    await supabase
      .from("user_subscriptions")
      .update({ expiry_reminder_sent_at: now.toISOString() })
      .eq("id", sub.id);

    await supabase.from("notifications").insert({
      user_id: sub.user_id,
      type: "subscription_expiring_soon",
      title: "Subscription expiring soon",
      message: `Your ${plan?.name ?? "subscription"} expires in less than 24 hours. Renew now to avoid interruption.`,
    });

    if (user?.email) {
      await sendEmail(
        user.email,
        "Your Sureodds Predict subscription expires soon",
        `<p>Hi ${user.full_name ?? "there"},</p><p>Your <strong>${plan?.name ?? "subscription"}</strong> expires in less than 24 hours. Renew from your dashboard to avoid losing access.</p>`
      );
    }

    reminded += 1;
  }

  return NextResponse.json({ expired, reminded });
}
