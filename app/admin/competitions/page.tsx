import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CompetitionsManager } from "@/components/admin/competitions-manager";

export const metadata: Metadata = { title: "Competitions" };

export default async function AdminCompetitionsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("competitions").select("*").order("display_order");

  return (
    <div>
      <h1 className="text-xl font-bold">Competitions</h1>
      <div className="mt-4">
        <CompetitionsManager competitions={data ?? []} />
      </div>
    </div>
  );
}
