import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "What personal data Sure Match Tips collects, why, who processes it and the choices you have.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" path="/privacy" updated="2026-11-25" intro="You can read every prediction on Sure Match Tips without giving us any personal information.">
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Contact form messages:</strong> the name, email address and message you send, so we can reply.
        </li>
        {/* User accounts are turned off.
        <li>
          <strong>Optional accounts:</strong> your email address, name and country, and any support messages you send through
          your account.
        </li>
        */}
        <li>
          <strong>Usage data:</strong> if analytics is enabled, pseudonymous information about pages visited and the device and
          browser used, collected through Google Analytics with IP anonymisation.
        </li>
        <li>
          <strong>Technical logs:</strong> our hosting provider keeps short-lived server logs (such as IP address and requested
          URL) for security and reliability.
        </li>
      </ul>
      <h2>How we use it</h2>
      <p>To run and improve the site, answer messages and understand which content is useful. We do not sell personal data.</p>
      <h2>Who processes it</h2>
      <ul>
        <li>Supabase — database and authentication</li>
        <li>Vercel — website hosting</li>
        <li>Google — analytics, only if enabled</li>
      </ul>
      <p>Football data providers (API-Sports) never receive your personal information.</p>
      <h2>Retention</h2>
      <p>Contact messages are kept while needed to provide the service, then deleted. You can ask us to delete your data at any time.</p>
      <h2>Your rights</h2>
      <p>
        You can ask to access, correct or delete your personal data, or object to its use, by <Link href="/contact">contacting us</Link>.
      </p>
      <h2>Cookies</h2>
      <p>
        See our <Link href="/cookies">Cookie Policy</Link>.
      </p>
    </LegalPage>
  );
}
