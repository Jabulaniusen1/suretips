import Link from "next/link";
import type { Metadata } from "next";
import { getAdminKpis } from "@/lib/data/admin-kpis";
import { formatPrice } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const kpis = await getAdminKpis();

  const cards = [
    { label: "Active Subscribers", value: kpis.activeSubscribers },
    { label: "Revenue Today", value: formatPrice(kpis.revenueToday, "NGN") },
    { label: "Revenue (7d)", value: formatPrice(kpis.revenue7d, "NGN") },
    { label: "Revenue (30d)", value: formatPrice(kpis.revenue30d, "NGN") },
    { label: "Pending Activations", value: kpis.pendingActivations },
    { label: "New Signups (24h)", value: kpis.newSignups24h },
    { label: "New Signups (7d)", value: kpis.newSignups7d },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold">Admin Dashboard</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/predictions/add" className="rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-brand">
          + Add Prediction
        </Link>
        <Link href="/admin/payment-methods" className="rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-brand">
          + Add Payment Method
        </Link>
        <Link href="/admin/pages" className="rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-brand">
          + Publish SEO Page
        </Link>
        <Link href="/admin/transactions" className="rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-brand">
          Review Transactions
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="font-bold">Recent Transactions</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {kpis.recentTransactions.map((tx) => {
                const row = tx as unknown as {
                  id: string;
                  created_at: string;
                  amount: number;
                  currency: string;
                  status: string;
                  users: { full_name: string | null; email: string } | null;
                  plans: { name: string } | null;
                };
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-2 text-muted-foreground">{formatShortDate(row.created_at)}</td>
                    <td className="px-4 py-2">{row.users?.full_name ?? row.users?.email}</td>
                    <td className="px-4 py-2">{row.plans?.name}</td>
                    <td className="px-4 py-2">{formatPrice(row.amount, row.currency)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={row.status === "completed" ? "default" : "secondary"}>{row.status}</Badge>
                    </td>
                  </tr>
                );
              })}
              {kpis.recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
