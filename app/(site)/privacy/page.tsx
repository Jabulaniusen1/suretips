import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>This Privacy Policy explains how Sureodds Predict collects, uses, and protects your information.</p>
      <h2>Information We Collect</h2>
      <p>
        Contact details (name, email, phone, country), payment proof images you upload at checkout, and usage
        data such as predictions you view.
      </p>
      <h2>How We Use Your Information</h2>
      <p>
        To provide and improve the service, verify payments, send transactional emails (payment confirmations,
        expiry reminders), and respond to support requests.
      </p>
      <h2>Data Storage</h2>
      <p>Your data is stored securely with Supabase and protected by row-level security policies restricting access to your own records and our admin team.</p>
      <h2>Third Parties</h2>
      <p>We use API-Sports for football data and SMTP providers for email delivery. We do not sell your personal data.</p>
      <h2>Your Rights</h2>
      <p>You can ask us to update or delete your contact information at any time by contacting support.</p>
      <p className="text-sm text-muted-foreground">This is template content — have it reviewed by a lawyer before launch.</p>
    </LegalPage>
  );
}
