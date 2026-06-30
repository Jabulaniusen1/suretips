import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionsTable } from "@/components/admin/transactions-table";
import {
  getAllTransactions,
  getPendingActivationTransactions,
  getPendingSubscriptionTransactions,
} from "@/lib/data/transactions";

export const metadata: Metadata = { title: "Transactions" };

export default async function AdminTransactionsPage() {
  const [pendingSubs, pendingActivations, all] = await Promise.all([
    getPendingSubscriptionTransactions(),
    getPendingActivationTransactions(),
    getAllTransactions(),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold">Transactions</h1>
      <Tabs defaultValue="pending-subscriptions" className="mt-4">
        <TabsList>
          <TabsTrigger value="pending-subscriptions">Pending Subscriptions ({pendingSubs.length})</TabsTrigger>
          <TabsTrigger value="pending-activations">Pending Activations ({pendingActivations.length})</TabsTrigger>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="pending-subscriptions" className="mt-4">
          <TransactionsTable transactions={pendingSubs} />
        </TabsContent>
        <TabsContent value="pending-activations" className="mt-4">
          <TransactionsTable transactions={pendingActivations} />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <TransactionsTable transactions={all} showActions={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
