"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteCustomPage } from "@/lib/actions/client";
import { isCustomPageIndexable } from "@/lib/seo/custom-page-rules";
import { isMarketPageSlug } from "@/lib/seo/market-pages";
import type { Tables } from "@/types/database";

export function CustomPagesManager({ pages }: { pages: Tables<"custom_pages">[] }) {
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
        <Button render={<Link href="/admin/pages/add" />}>
          <Plus className="size-4" /> Add page
        </Button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Search</th>
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
                <td className="px-4 py-2 text-xs">
                  {isMarketPageSlug(page.slug) ? (
                    <span className="text-brand">Overrides built-in page</span>
                  ) : isCustomPageIndexable(page) ? (
                    <span className="text-emerald-600">Indexable</span>
                  ) : (
                    <span className="text-muted-foreground">Noindex</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${page.title}`} render={<Link href={`/admin/pages/${page.id}`} />}>
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
    </div>
  );
}
