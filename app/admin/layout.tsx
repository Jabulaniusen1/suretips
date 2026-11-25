import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin, getAdminBadgeCounts } from "@/lib/data/admin";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login?redirect=/admin");

  const badges = await getAdminBadgeCounts();

  return (
    <div className="flex min-h-screen flex-col bg-secondary/40 md:flex-row">
      <AdminSidebar badges={badges} />
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
    </div>
  );
}
