import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PredictionForm } from "@/components/admin/prediction-form";
import { getActivePlans } from "@/lib/data/plans";

export const metadata: Metadata = { title: "Edit Prediction" };

export default async function EditPredictionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: prediction }, plans] = await Promise.all([
    supabase.from("predictions").select("*").eq("id", id).maybeSingle(),
    getActivePlans(),
  ]);

  if (!prediction) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold">Edit Prediction</h1>
      <div className="mt-4">
        <PredictionForm plans={plans} prediction={prediction} />
      </div>
    </div>
  );
}
