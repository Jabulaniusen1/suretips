"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/utils/date";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import type { Tables } from "@/types/database";

export function NotificationsList({ notifications, userId }: { notifications: Tables<"notifications">[]; userId: string }) {
  const [items, setItems] = useState(notifications);

  async function handleMarkRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await markNotificationRead(id);
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsRead(userId);
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
          Mark all as read
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((notification) => (
          <button
            key={notification.id}
            onClick={() => handleMarkRead(notification.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border p-4 text-left",
              notification.read ? "border-border bg-card" : "border-brand/40 bg-accent"
            )}
          >
            <Bell className={cn("mt-0.5 size-4 shrink-0", notification.read ? "text-muted-foreground" : "text-brand")} />
            <div>
              <p className="text-sm font-semibold">{notification.title}</p>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatShortDate(notification.created_at)}</p>
            </div>
          </button>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
      </div>
    </div>
  );
}
