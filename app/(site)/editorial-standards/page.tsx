import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Editorial Standards",
  description:
    "The standards Sure Match Tips follows for predictions, articles and statistics: accuracy, no guaranteed wins, no fabricated data and clear corrections.",
  path: "/editorial-standards",
});

export default function EditorialStandardsPage() {
  return (
    <LegalPage
      title="Editorial Standards"
      path="/editorial-standards"
      updated="2026-11-19"
      intro="These are the rules our predictions, articles and statistics follow. They exist so you can trust what you read here — and hold us to it."
    >
      <h2>Accuracy over hype</h2>
      <ul>
        <li>We never describe a prediction as guaranteed, “sure”, “fixed” or risk-free.</li>
        <li>We never publish invented statistics, head-to-head records, injuries or quotes. Match data comes from API-Sports and is labelled as such.</li>
        <li>Performance figures are calculated from our own verified results and are never edited by hand.</li>
      </ul>

      <h2>Predictions</h2>
      <ul>
        <li>Every prediction is published before kickoff and stays on our results record whether it wins or loses.</li>
        <li>Selections and odds are frozen once a match starts. If a pick is corrected before kickoff, the published record follows the correction; after kickoff it never changes.</li>
        <li>Results count only after an editor has checked them against the official score.</li>
      </ul>

      <h2>Articles</h2>
      <ul>
        <li>Articles are written to explain — how a market works, what the numbers say about a league or team — not to push bets.</li>
        <li>Articles show who wrote them. Posts without a named author are written by the Sure Match Tips editorial team. We do not invent authors or credentials.</li>
        <li>Software tools may help with research and drafting, but every article is reviewed and fact-checked by an editor before publication.</li>
        <li>Each article shows when it was published and when it was last substantially updated.</li>
      </ul>

      <h2>Advertising and links</h2>
      <p>
        Sure Match Tips is free. Any sponsored or advertising link is labelled and marked <code>sponsored</code>; advertisers
        have no say over our predictions or articles.
      </p>

      <h2>Corrections</h2>
      <p>
        If you find a mistake — a wrong score, a mis-graded result, an inaccurate fact in an article — please{" "}
        <Link href="/contact">contact us</Link>. We correct errors promptly and, where a result was affected, the change is
        reflected in our statistics.
      </p>

      <h2>Responsible betting</h2>
      <p>
        Our content is for adults (18+) and is information, not financial advice. We remind readers that every bet can lose and
        point to <Link href="/responsible-betting">support resources</Link> throughout the site.
      </p>
    </LegalPage>
  );
}
