"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentMethodForm } from "@/components/admin/payment-method-form";
import { deletePaymentMethod } from "@/lib/actions/admin/payment-methods";
import type { Tables } from "@/types/database";

export function PaymentMethodsManager({ methods }: { methods: Tables<"payment_methods">[] }) {
  const [editing, setEditing] = useState<Tables<"payment_methods"> | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this payment method?")) return;
    setBusyId(id);
    try {
      await deletePaymentMethod(id);
      toast.success("Deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add Payment Method
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {methods.map((method) => (
          <div key={method.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold">{method.name}</p>
                <p className="text-xs uppercase text-muted-foreground">{method.type.replace("_", " ")}</p>
              </div>
              <Badge variant={method.is_active ? "default" : "secondary"}>
                {method.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {method.countries.length === 0 ? "All countries" : method.countries.join(", ")}
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(method)}>
                <Pencil className="size-3.5" /> Edit
              </Button>
              <Button variant="ghost" size="sm" disabled={busyId === method.id} onClick={() => handleDelete(method.id)}>
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          </div>
        ))}
        {methods.length === 0 && <p className="text-sm text-muted-foreground">No payment methods yet.</p>}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <PaymentMethodForm onSaved={() => setAdding(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
          </DialogHeader>
          {editing && <PaymentMethodForm method={editing} onSaved={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
