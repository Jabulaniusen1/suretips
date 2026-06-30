import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy">
      <h2>Eligibility</h2>
      <p>
        Refund requests must be submitted within 24 hours of payment confirmation and before any predictions
        for the subscribed package have been viewed.
      </p>
      <h2>Non-Refundable Cases</h2>
      <ul>
        <li>Once predictions for the current day have been viewed or unlocked.</li>
        <li>Dissatisfaction with the outcome of a prediction (we do not guarantee results).</li>
        <li>Correct Scores activation fees, once predictions have been unlocked.</li>
      </ul>
      <h2>How to Request a Refund</h2>
      <p>Contact our support team via the Contact Admin option in your dashboard with your transaction details. Approved refunds are processed within 5–7 business days via the original payment method where possible.</p>
      <p className="text-sm text-muted-foreground">This is template content — have it reviewed by a lawyer before launch.</p>
    </LegalPage>
  );
}
