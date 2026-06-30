"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createAdLink, deleteAdLink, toggleAdLinkActive } from "@/lib/actions/admin/ad-links";
import type { Tables } from "@/types/database";

export function AdLinksManager({ links }: { links: Tables<"ad_links">[] }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd() {
    if (!title || !url) return toast.error("Title and URL are required");
    setSubmitting(true);
    try {
      await createAdLink({ title, url, description, is_active: true });
      toast.success("Added");
      setTitle("");
      setUrl("");
      setDescription("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteAdLink(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggle(id: string, value: boolean) {
    setBusyId(id);
    try {
      await toggleAdLinkActive(id, value);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button className="sm:col-span-4 w-fit" size="sm" onClick={handleAdd} disabled={submitting}>
          Add Link
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">URL</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {links.map((link) => (
              <tr key={link.id}>
                <td className="px-4 py-2 font-medium">{link.title}</td>
                <td className="max-w-xs truncate px-4 py-2 text-muted-foreground">{link.url}</td>
                <td className="px-4 py-2">
                  <Switch
                    checked={link.is_active}
                    disabled={busyId === link.id}
                    onCheckedChange={(v) => handleToggle(link.id, v)}
                  />
                </td>
                <td className="px-4 py-2">
                  <Button variant="ghost" size="icon-sm" disabled={busyId === link.id} onClick={() => handleDelete(link.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No ad links yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
