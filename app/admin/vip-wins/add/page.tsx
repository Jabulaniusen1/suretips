import type { Metadata } from "next";
import { getActivePlans } from "@/lib/data/plans";
import { VipWinningForm } from "@/components/admin/vip-winning-form";

export const metadata: Metadata = { title: "Add VIP Winning" };

export default async function AddVipWinningPage() {
  const plans = await getActivePlans();

  return (
    <div>
      <h1 className="text-xl font-bold">Add VIP Winning</h1>
      <div className="mt-4">
        <VipWinningForm plans={plans} />
      </div>
    </div>
  );
}
