import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PaymentMethodsManager } from "@/components/admin/payment-methods-manager";

export const metadata: Metadata = { title: "Payment Methods" };

export default async function AdminPaymentMethodsPage() {
  const supabase = await createClient();
  const { data: methods } = await supabase.from("payment_methods").select("*").order("display_order");

  return (
    <div>
      <h1 className="text-xl font-bold">Payment Methods</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        These are shown to users at checkout for manual proof-of-payment submission.
      </p>
      <div className="mt-4">
        <PaymentMethodsManager methods={methods ?? []} />
      </div>
    </div>
  );
}
