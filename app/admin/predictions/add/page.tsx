import type { Metadata } from "next";
import { PredictionForm } from "@/components/admin/prediction-form";
import { getActivePlans } from "@/lib/data/plans";

export const metadata: Metadata = { title: "Add Prediction" };

export default async function AddPredictionPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planSlug } = await searchParams;
  const plans = await getActivePlans();
  const defaultPlanId = planSlug ? plans.find((p) => p.slug === planSlug)?.id : undefined;

  return (
    <div>
      <h1 className="text-xl font-bold">Add Prediction</h1>
      <div className="mt-4">
        <PredictionForm plans={plans} defaultPlanId={defaultPlanId} />
      </div>
    </div>
  );
}
