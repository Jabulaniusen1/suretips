"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/lib/utils/date";
import { deleteBlogPost } from "@/lib/actions/client";
import type { Tables } from "@/types/database";

export function BlogList({ posts }: { posts: Tables<"blog_posts">[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    setBusyId(id);
    try {
      await deleteBlogPost(id);
      toast.success("Deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Views</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {posts.map((post) => (
            <tr key={post.id}>
              <td className="px-4 py-2 font-medium">{post.title}</td>
              <td className="px-4 py-2">
                <Badge variant={post.published ? "default" : "secondary"}>{post.published ? "Published" : "Draft"}</Badge>
              </td>
              <td className="px-4 py-2 text-muted-foreground">{post.view_count}</td>
              <td className="px-4 py-2 text-muted-foreground">
                {post.published_at ? formatShortDate(post.published_at) : "—"}
              </td>
              <td className="px-4 py-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" render={<Link href={`/admin/blog/write?id=${post.id}`} />}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" disabled={busyId === post.id} onClick={() => handleDelete(post.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                No posts yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
