import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PlanDetailForm } from "@/components/admin/plan-detail-form";
import { PlanPricesManager } from "@/components/admin/plan-prices-manager";

export const metadata: Metadata = { title: "Manage Plan" };

export default async function AdminPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: plan }, { data: prices }] = await Promise.all([
    supabase.from("plans").select("*").eq("id", id).maybeSingle(),
    supabase.from("plan_prices").select("*").eq("plan_id", id).order("country"),
  ]);

  if (!plan) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold">{plan.name}</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <PlanDetailForm plan={plan} />
        <PlanPricesManager planId={plan.id} requiresActivation={plan.requires_activation} prices={prices ?? []} />
      </div>
    </div>
  );
}
