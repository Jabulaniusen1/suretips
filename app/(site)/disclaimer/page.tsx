import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Disclaimer",
  description: "Sure Match Tips predictions are information, not advice. Football outcomes are uncertain and past results do not guarantee future results.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" path="/disclaimer" updated="2026-11-19">
      <p>
        Sure Match Tips publishes football predictions for information and entertainment only. We are not a bookmaker, and nothing
        on this site is financial, investment or betting advice.
      </p>
      <h2>No guarantees</h2>
      <p>
        Sports outcomes are inherently unpredictable. Confidence figures are estimates, not probabilities you can rely on, and past
        performance shown on our <Link href="/previous-results">Previous Results</Link> page does not guarantee future results.
      </p>
      <h2>Third-party data</h2>
      <p>Fixtures, odds, scores and statistics come from third parties and may contain errors or delays.</p>
      <h2>Age and legality</h2>
      <p>Content about betting is for adults aged 18+. Betting laws differ between countries — you are responsible for complying with yours.</p>
      <h2>Get help</h2>
      <p>
        If betting is causing you problems, see our <Link href="/responsible-betting">responsible betting</Link> page for support.
      </p>
    </LegalPage>
  );
}
