import type { Tables } from "@/types/database";

type Plan = Tables<"plans">;
type Subscription = Tables<"user_subscriptions">;

export function isPlanUnlocked(plan: Plan, subscription: Subscription | null | undefined): boolean {
  if (!subscription) return false;
  if (subscription.plan_status !== "active") return false;
  if (plan.requires_activation && !subscription.activation_fee_paid) return false;
  return true;
}

export function isPendingActivation(plan: Plan, subscription: Subscription | null | undefined): boolean {
  if (!subscription) return false;
  return plan.requires_activation && subscription.plan_status === "pending_activation";
}

export function isExpired(subscription: Subscription | null | undefined): boolean {
  return subscription?.plan_status === "expired";
}
