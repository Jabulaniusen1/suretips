"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomPageForm } from "@/components/admin/custom-page-form";
import { deleteCustomPage } from "@/lib/actions/admin/custom-pages";
import type { Tables } from "@/types/database";

export function CustomPagesManager({ pages }: { pages: Tables<"custom_pages">[] }) {
  const [editing, setEditing] = useState<Tables<"custom_pages"> | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this page?")) return;
    setBusyId(id);
    try {
      await deleteCustomPage(id);
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
          <Plus className="size-4" /> Add Page
        </Button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pages.map((page) => (
              <tr key={page.id}>
                <td className="px-4 py-2 font-medium">{page.title}</td>
                <td className="px-4 py-2 text-muted-foreground">/tips/{page.slug}</td>
                <td className="px-4 py-2">
                  <Badge variant={page.is_published ? "default" : "secondary"}>
                    {page.is_published ? "Published" : "Draft"}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(page)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" disabled={busyId === page.id} onClick={() => handleDelete(page.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Page</DialogTitle>
          </DialogHeader>
          <CustomPageForm onSaved={() => setAdding(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
          </DialogHeader>
          {editing && <CustomPageForm page={editing} onSaved={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
