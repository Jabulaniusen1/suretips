import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PredictionForm } from "@/components/admin/prediction-form";

export const metadata: Metadata = { title: "Edit prediction" };

export default async function EditPredictionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: prediction } = await supabase.from("predictions").select("*").eq("id", id).maybeSingle();
  if (!prediction) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold">Edit prediction</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Published {new Date(prediction.published_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} WAT ·{" "}
        {prediction.result_approved ? "Result approved" : "Result not approved"}
      </p>
      <div className="mt-4">
        <PredictionForm prediction={prediction} />
      </div>
    </div>
  );
}
