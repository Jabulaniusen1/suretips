import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin, getAdminBadgeCounts } from "@/lib/data/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const badges = await getAdminBadgeCounts();

  return (
    <div className="flex min-h-screen bg-secondary/40">
      <AdminSidebar badges={badges} />
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
    </div>
  );
}
