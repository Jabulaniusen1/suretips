import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { PredictionsTable } from "@/components/admin/predictions-table";
import { getAdminPredictions } from "@/lib/data/admin-predictions";

export const metadata: Metadata = { title: "Predictions" };

export default async function AdminPredictionsPage() {
  const predictions = await getAdminPredictions();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Predictions</h1>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/predictions/add-with-api" />}>
            Sync from API
          </Button>
          <Button render={<Link href="/admin/predictions/add" />}>+ Add Prediction</Button>
        </div>
      </div>
      <div className="mt-4">
        <PredictionsTable predictions={predictions} />
      </div>
    </div>
  );
}
