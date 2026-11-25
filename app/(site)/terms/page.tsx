import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description: "The terms that apply when you use Sure Match Tips, a free football predictions and information website.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" path="/terms" updated="2026-11-25" intro="By using Sure Match Tips you agree to these terms. Please read them alongside our Privacy Policy and Disclaimer.">
      <h2>1. The service</h2>
      <p>
        Sure Match Tips provides free football predictions, statistics and related articles for information and entertainment.
        We are not a bookmaker, we do not accept bets, and nothing on the site is financial or betting advice.
      </p>
      <h2>2. Eligibility</h2>
      <p>You must be 18 or over, or the legal betting age where you live if that is higher, to use content relating to betting.</p>
      <h2>3. No guarantee of outcome</h2>
      <p>
        Football results are uncertain. Predictions, confidence figures and statistics are opinions and estimates; they may be
        wrong. You are solely responsible for any decision you make, including any bet you place with a third party.
      </p>
      <h2>4. Accuracy of data</h2>
      <p>
        Fixtures, scores, odds and statistics come from third-party providers and may occasionally be delayed or incorrect. Odds
        shown were available when a prediction was published and may differ from current prices.
      </p>
      <h2>5. Accounts</h2>
      <p>The site does not offer user accounts. Everything is available without signing in.</p>
      <h2>6. Acceptable use</h2>
      <p>Do not misuse the site: no scraping that degrades the service, attempts to access restricted areas, or unlawful activity.</p>
      <h2>7. Intellectual property</h2>
      <p>
        Content written by Sure Match Tips is ours. You may quote small extracts with a link back. Team names, crests and
        competition marks belong to their respective owners.
      </p>
      <h2>8. Third-party links and advertising</h2>
      <p>
        The site may link to third-party websites, including clearly labelled sponsored links. We are not responsible for their
        content, products or practices.
      </p>
      <h2>9. Liability</h2>
      <p>
        To the extent permitted by law, Sure Match Tips is not liable for any loss arising from the use of the site or reliance
        on its content, including betting losses.
      </p>
      <h2>10. Changes</h2>
      <p>We may update these terms. The date above shows when they last changed; continued use means you accept the current version.</p>
      <h2>11. Contact</h2>
      <p>
        Questions about these terms: <Link href="/contact">contact us</Link>.
      </p>
    </LegalPage>
  );
}
