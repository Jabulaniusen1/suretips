import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>
        These Terms govern your use of Sureodds Predict. By using the site or subscribing to a VIP package,
        you agree to these Terms.
      </p>
      <h2>1. Service Description</h2>
      <p>
        Sureodds Predict provides football predictions, statistics, and related content for informational and
        entertainment purposes. We do not operate as a bookmaker and do not accept bets.
      </p>
      <h2>2. Subscriptions & Payment</h2>
      <p>
        VIP packages are paid manually via bank transfer, mobile money, or cryptocurrency. Access is granted
        after our team verifies your proof of payment. Subscription duration begins on the date of
        confirmation, not the date of payment submission.
      </p>
      <h2>3. No Guarantee of Outcome</h2>
      <p>
        Football is unpredictable. No prediction, package, or combo guarantees a winning outcome. You accept
        full responsibility for any betting decisions made using our content.
      </p>
      <h2>4. Customer Responsibilities</h2>
      <p>You are responsible for providing accurate contact details and for all betting decisions made using our content.</p>
      <h2>5. Changes to These Terms</h2>
      <p>We may update these Terms from time to time. Continued use of the service constitutes acceptance of any changes.</p>
      <p className="text-sm text-muted-foreground">This is template content — have it reviewed by a lawyer before launch.</p>
    </LegalPage>
  );
}
