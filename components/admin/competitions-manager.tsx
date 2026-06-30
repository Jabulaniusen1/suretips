"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompetitionForm } from "@/components/admin/competition-form";
import { deleteCompetition } from "@/lib/actions/admin/competitions";
import type { Tables } from "@/types/database";

export function CompetitionsManager({ competitions }: { competitions: Tables<"competitions">[] }) {
  const [editing, setEditing] = useState<Tables<"competitions"> | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this competition page?")) return;
    setBusyId(id);
    try {
      await deleteCompetition(id);
      toast.success("Deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add Competition
        </Button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {competitions.map((comp) => (
          <div key={comp.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <p className="font-bold">{comp.name}</p>
              <Badge variant={comp.status === "active" ? "default" : "secondary"}>{comp.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">/competitions/{comp.slug}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(comp)}>
                <Pencil className="size-3.5" /> Edit
              </Button>
              <Button variant="ghost" size="sm" disabled={busyId === comp.id} onClick={() => handleDelete(comp.id)}>
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Competition</DialogTitle>
          </DialogHeader>
          <CompetitionForm onSaved={() => setAdding(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Competition</DialogTitle>
          </DialogHeader>
          {editing && <CompetitionForm competition={editing} onSaved={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
