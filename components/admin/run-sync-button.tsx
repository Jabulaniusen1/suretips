"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAutoSyncNow, runScoreUpdateNow } from "@/lib/actions/client";

export function RunSyncButton({ job }: { job: "sync" | "scores" }) {
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      if (job === "sync") {
        const results = await runAutoSyncNow();
        const inserted = results.reduce((n, r) => n + r.inserted, 0);
        const failed = results.filter((r) => r.status === "error" || r.status === "partial");
        if (failed.length > 0) toast.warning(`Added ${inserted} picks. ${failed.map((r) => `${r.date}: ${r.error}`).join(" · ")}`);
        else toast.success(inserted > 0 ? `Added ${inserted} new picks` : "Nothing to add — every market is covered or no fixtures qualified");
      } else {
        const result = await runScoreUpdateNow();
        if (result.errors.length > 0) toast.warning(`Updated ${result.updated}. Errors: ${result.errors.slice(0, 2).join(" · ")}`);
        else toast.success(`Checked ${result.checked}, updated ${result.updated}, graded ${result.graded}, approved ${result.approved}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button variant="outline" onClick={run} disabled={running}>
      <RefreshCw aria-hidden className={running ? "size-4 animate-spin" : "size-4"} />
      {running ? "Running…" : job === "sync" ? "Run prediction sync now" : "Update scores now"}
    </Button>
  );
}
