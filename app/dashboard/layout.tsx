import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-secondary/40">
      <DashboardHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
