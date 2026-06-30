import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UsersTable } from "@/components/admin/users-table";
import { requireAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: users } = await supabase.from("users").select("*").order("created_at", { ascending: false }).limit(200);

  return (
    <div>
      <h1 className="text-xl font-bold">Users</h1>
      <div className="mt-4">
        <UsersTable users={users ?? []} currentUserId={admin!.authId} />
      </div>
    </div>
  );
}
