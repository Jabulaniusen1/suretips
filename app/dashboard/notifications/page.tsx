import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/current-user";
import { NotificationsList } from "@/components/dashboard/notifications-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.authId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-xl font-bold">Notifications</h1>
      <div className="mt-4">
        <NotificationsList notifications={data ?? []} userId={user.authId} />
      </div>
    </div>
  );
}
