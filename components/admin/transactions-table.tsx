"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import { getSignedProofUrl } from "@/lib/actions/admin/storage";
import { confirmSubscriptionPayment, confirmActivationPayment, rejectTransaction } from "@/lib/actions/admin/transactions";
import type { TransactionRow } from "@/lib/data/transactions";

export function TransactionsTable({ transactions, showActions = true }: { transactions: TransactionRow[]; showActions?: boolean }) {
  const [rejectTarget, setRejectTarget] = useState<TransactionRow | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function viewProof(path?: string) {
    if (!path) return toast.error("No proof uploaded");
    const url = await getSignedProofUrl(path);
    if (url) window.open(url, "_blank");
    else toast.error("Could not load proof image");
  }

  async function handleConfirm(tx: TransactionRow) {
    setBusyId(tx.id);
    try {
      if (tx.payment_type === "activation") await confirmActivationPayment(tx.id);
      else await confirmSubscriptionPayment(tx.id);
      toast.success("Payment confirmed — access code generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to confirm");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await rejectTransaction(rejectTarget.id, reason);
      toast.success("Transaction rejected");
      setRejectTarget(null);
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setBusyId(null);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("Access code copied");
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">User / Contact</th>
              <th className="px-4 py-2">Plan</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Method</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Access Code</th>
              <th className="px-4 py-2">Proof</th>
              {showActions && <th className="px-4 py-2">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => {
              const contactName = tx.metadata.contact_name;
              const contactEmail = tx.metadata.contact_email;
              const contactPhone = tx.metadata.contact_phone;
              const displayName = tx.users?.full_name ?? tx.users?.email ?? contactName ?? contactEmail ?? "Guest";

              return (
                <tr key={tx.id}>
                  <td className="px-4 py-2 text-muted-foreground">{formatShortDate(tx.created_at)}</td>
                  <td className="px-4 py-2">
                    <p className="font-medium">{displayName}</p>
                    {!tx.users && (contactEmail || contactPhone) && (
                      <p className="text-xs text-muted-foreground">
                        {contactEmail}
                        {contactPhone && ` · ${contactPhone}`}
                      </p>
                    )}
                    {!tx.users && !contactEmail && !contactPhone && (
                      <p className="text-xs text-muted-foreground">Guest</p>
                    )}
                  </td>
                  <td className="px-4 py-2">{tx.plans?.name}</td>
                  <td className="px-4 py-2 capitalize">{tx.payment_type}</td>
                  <td className="px-4 py-2">{formatPrice(tx.amount, tx.currency)}</td>
                  <td className="px-4 py-2">{tx.payment_method_name}</td>
                  <td className="px-4 py-2">
                    <Badge variant={tx.status === "completed" ? "default" : tx.status === "failed" ? "destructive" : "secondary"}>
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    {tx.access_codes ? (
                      <button
                        type="button"
                        onClick={() => copyCode(tx.access_codes!.code)}
                        className="flex items-center gap-1 rounded bg-accent px-2 py-1 font-mono text-sm font-bold tracking-widest hover:bg-accent/80"
                        title="Click to copy"
                      >
                        {tx.access_codes.code}
                        <Copy className="size-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Button variant="ghost" size="icon-sm" onClick={() => viewProof(tx.metadata.payment_proof_url)}>
                      <Eye className="size-4" />
                    </Button>
                  </td>
                  {showActions && (
                    <td className="px-4 py-2">
                      {tx.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" disabled={busyId === tx.id} onClick={() => handleConfirm(tx)}>
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" disabled={busyId === tx.id} onClick={() => setRejectTarget(tx)}>
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-muted-foreground">
                  Nothing here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transaction</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (shown to the user)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={busyId === rejectTarget?.id}>
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
