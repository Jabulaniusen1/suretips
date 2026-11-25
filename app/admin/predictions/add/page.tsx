import type { Metadata } from "next";
import { PredictionForm } from "@/components/admin/prediction-form";

export const metadata: Metadata = { title: "Add prediction" };

export default function AddPredictionPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">Add prediction</h1>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        Published immediately. Once the match kicks off, the pick and odds are frozen on the public results record.
      </p>
      <div className="mt-4">
        <PredictionForm />
      </div>
    </div>
  );
}
