"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { upsertPlanPrice, deletePlanPrice } from "@/lib/actions/admin/plans";
import { COUNTRIES } from "@/lib/constants";
import { formatPrice, CURRENCY_CODES } from "@/lib/utils/currency";
import type { Tables } from "@/types/database";

export function PlanPricesManager({
  planId,
  requiresActivation,
  prices,
}: {
  planId: string;
  requiresActivation: boolean;
  prices: Tables<"plan_prices">[];
}) {
  const [country, setCountry] = useState<string>(COUNTRIES[0]);
  const [duration, setDuration] = useState<"7" | "30">("30");
  const [price, setPrice] = useState("");
  const [activationFee, setActivationFee] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!price) return toast.error("Enter a price");
    setBusy(true);
    try {
      await upsertPlanPrice({
        plan_id: planId,
        country,
        duration_days: Number(duration) as 7 | 30,
        price: Number(price),
        activation_fee: activationFee ? Number(activationFee) : undefined,
        currency,
      });
      toast.success("Price saved");
      setPrice("");
      setActivationFee("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await deletePlanPrice(id, planId);
      toast.success("Price removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-bold">Pricing by Country</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="space-y-1">
          <Label className="text-xs">Country</Label>
          <SearchableSelect value={country} onChange={setCountry} options={COUNTRIES} searchPlaceholder="Search countries…" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duration</Label>
          <Select value={duration} onValueChange={(v) => setDuration((v ?? "30") as "7" | "30")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">1 Week</SelectItem>
              <SelectItem value="30">1 Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Currency</Label>
          <SearchableSelect value={currency} onChange={setCurrency} options={CURRENCY_CODES} searchPlaceholder="Search currency…" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Price</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        {requiresActivation && (
          <div className="space-y-1">
            <Label className="text-xs">Activation Fee</Label>
            <Input type="number" value={activationFee} onChange={(e) => setActivationFee(e.target.value)} />
          </div>
        )}
      </div>
      <Button className="mt-3" size="sm" onClick={handleAdd} disabled={busy}>
        Save Price
      </Button>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="py-2">Country</th>
              <th className="py-2">Duration</th>
              <th className="py-2">Price</th>
              {requiresActivation && <th className="py-2">Activation Fee</th>}
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {prices.map((p) => (
              <tr key={p.id}>
                <td className="py-2">{p.country}</td>
                <td className="py-2">{p.duration_days === 7 ? "1 Week" : "1 Month"}</td>
                <td className="py-2">{formatPrice(p.price, p.currency)}</td>
                {requiresActivation && (
                  <td className="py-2">{p.activation_fee ? formatPrice(p.activation_fee, p.currency) : "—"}</td>
                )}
                <td className="py-2">
                  <Button variant="ghost" size="icon-sm" disabled={busy} onClick={() => handleDelete(p.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
