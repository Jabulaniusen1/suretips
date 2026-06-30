import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PlansList } from "@/components/admin/plans-list";

export const metadata: Metadata = { title: "Plans" };

export default async function AdminPlansPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase.from("plans").select("*").order("display_order");

  return (
    <div>
      <h1 className="text-xl font-bold">Plans</h1>
      <p className="mt-1 text-sm text-muted-foreground">Toggle visibility and manage per-country pricing.</p>
      <div className="mt-4">
        <PlansList plans={plans ?? []} />
      </div>
    </div>
  );
}
