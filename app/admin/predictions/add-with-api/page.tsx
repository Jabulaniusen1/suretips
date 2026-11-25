import type { Metadata } from "next";
import { SyncPredictionsForm } from "@/components/admin/sync-predictions-form";
import { RunSyncButton } from "@/components/admin/run-sync-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sync from API" };

export default async function AdminSyncPage() {
  const supabase = await createClient();
  const { data: competitions } = await supabase.from("competitions").select("name, league_id").not("league_id", "is", null).order("display_order");
  const leagues = (competitions ?? []).map((c) => ({ id: c.league_id as number, name: c.name }));

  return (
    <div className="space-y-8">
      <section className="max-w-xl">
        <h1 className="text-xl font-bold">Sync from API</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The automatic sync runs every 4 hours and fills every market for today, tomorrow and the day after. Run it now if you
          need fresh picks immediately.
        </p>
        <div className="mt-4">
          <RunSyncButton job="sync" />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-bold">Manual match-result sync</h2>
        <div className="mt-3">
          <SyncPredictionsForm leagues={leagues} />
        </div>
      </section>
    </div>
  );
}
