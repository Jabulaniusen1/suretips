import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { VipWinsTable } from "@/components/admin/vip-wins-table";

export const metadata: Metadata = { title: "VIP Wins" };

export default async function AdminVipWinsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vip_winnings")
    .select("*, plans(name)")
    .order("date", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">VIP Wins</h1>
        <Button render={<Link href="/admin/vip-wins/add" />}>+ Add VIP Winning</Button>
      </div>
      <div className="mt-4">
        <VipWinsTable entries={(data ?? []) as never} />
      </div>
    </div>
  );
}
