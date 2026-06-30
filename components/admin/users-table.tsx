"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { formatShortDate } from "@/lib/utils/date";
import { toggleUserAdmin } from "@/lib/actions/admin/users";
import type { Tables } from "@/types/database";

export function UsersTable({ users, currentUserId }: { users: Tables<"users">[]; currentUserId: string }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggle(id: string, value: boolean) {
    setBusyId(id);
    try {
      await toggleUserAdmin(id, value);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Country</th>
            <th className="px-4 py-2">Joined</th>
            <th className="px-4 py-2">Admin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-2 font-medium">{user.full_name ?? "—"}</td>
              <td className="px-4 py-2 text-muted-foreground">{user.email}</td>
              <td className="px-4 py-2">{user.country}</td>
              <td className="px-4 py-2 text-muted-foreground">{formatShortDate(user.created_at)}</td>
              <td className="px-4 py-2">
                <Switch
                  checked={user.is_admin}
                  disabled={busyId === user.id || user.id === currentUserId}
                  onCheckedChange={(v) => handleToggle(user.id, v)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
