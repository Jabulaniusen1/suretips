import type { Metadata } from "next";
import { SyncPredictionsForm } from "@/components/admin/sync-predictions-form";
import { getActivePlans } from "@/lib/data/plans";

export const metadata: Metadata = { title: "Sync Predictions from API" };

export default async function AddWithApiPage() {
  const plans = await getActivePlans();

  return (
    <div>
      <h1 className="text-xl font-bold">Sync Predictions from API</h1>
      <div className="mt-4">
        <SyncPredictionsForm plans={plans} />
      </div>
    </div>
  );
}
