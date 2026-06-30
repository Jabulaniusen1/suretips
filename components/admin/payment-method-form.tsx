"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { createPaymentMethod, updatePaymentMethod } from "@/lib/actions/admin/payment-methods";
import { CURRENCY_CODES } from "@/lib/utils/currency";
import type { Tables } from "@/types/database";

export function PaymentMethodForm({ method, onSaved }: { method?: Tables<"payment_methods">; onSaved?: () => void }) {
  const [name, setName] = useState(method?.name ?? "");
  const [type, setType] = useState<Tables<"payment_methods">["type"]>(method?.type ?? "bank_transfer");
  const [currency, setCurrency] = useState(method?.currency ?? "NGN");
  const [countries, setCountries] = useState((method?.countries ?? []).join(", "));
  const [details, setDetails] = useState(JSON.stringify(method?.details ?? {}, null, 2));
  const [isActive, setIsActive] = useState(method?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    let parsedDetails: Record<string, unknown>;
    try {
      parsedDetails = JSON.parse(details || "{}");
    } catch {
      toast.error("Details must be valid JSON");
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        name,
        type,
        currency,
        details: parsedDetails,
        countries: countries.split(",").map((c) => c.trim()).filter(Boolean),
        is_active: isActive,
        display_order: method?.display_order ?? 0,
      };
      if (method) await updatePaymentMethod(method.id, input);
      else await createPaymentMethod(input);
      toast.success("Saved");
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bank Transfer (Nigeria)" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType((v ?? "bank_transfer") as typeof type)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <SearchableSelect value={currency} onChange={setCurrency} options={CURRENCY_CODES} searchPlaceholder="Search currency…" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Visible in countries (comma-separated, blank = all countries)</Label>
        <Input value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="Nigeria, Ghana" />
      </div>
      <div className="space-y-2">
        <Label>Details (JSON shown to the user at checkout — account number, wallet address, etc.)</Label>
        <Textarea rows={6} value={details} onChange={(e) => setDetails(e.target.value)} className="font-mono text-xs" />
      </div>
      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <Button onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : method ? "Update Payment Method" : "Add Payment Method"}
      </Button>
    </div>
  );
}
