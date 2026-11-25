import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "About Us – Free Football Predictions You Can Check",
  description:
    "SureMatchContact is a free football predictions site: daily tips by market, match data and a verified public record of every result. Here is how it works.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <LegalPage
      title="About SureMatchContact"
      path="/about"
      updated="2026-11-23"
      intro="SureMatchContact is a free football predictions and match analysis site. Everything we publish is free to read, and every prediction stays on a public record — wins and losses."
    >
      <h2>What we publish</h2>
      <ul>
        <li>
          {/* DISABLED (correct score): was "... both teams to score, goals and correct score markets ..." */}
          <strong>Daily predictions</strong> across the match result, double chance, both teams to score and goals markets, each
          with its odds and a confidence figure.
        </li>
        <li>
          <strong>Match pages</strong> with the head-to-head record, recent form and league position for the teams involved.
        </li>
        <li>
          <strong>Competition hubs</strong> for the major leagues and tournaments, with fixtures, tables and our record in each.
        </li>
        <li>
          <strong>A verified results record</strong> on <Link href="/previous-results">Previous Results</Link>, with win rates for
          the last 7 days, 30 days and all time.
        </li>
        <li>
          <strong>Guides</strong> on the <Link href="/blog">blog</Link> explaining betting markets, odds and probability.
        </li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>We don&apos;t sell tips, subscriptions or “VIP” packages. There is no paid content.</li>
        <li>We don&apos;t promise guaranteed wins, “sure” odds or fixed matches — nobody can.</li>
        <li>We don&apos;t take bets. SureMatchContact is not a bookmaker.</li>
        <li>We don&apos;t delete losing predictions or edit picks after kickoff.</li>
      </ul>

      <h2>How predictions are made</h2>
      <p>
        Most predictions are selected automatically from bookmaker odds using published rules; others are added by our editors.
        Our <Link href="/methodology">methodology</Link> explains the rules, what confidence means and how results are verified,
        and our <Link href="/editorial-standards">editorial standards</Link> set out what we will and won&apos;t publish.
      </p>

      <h2>Data</h2>
      <p>Fixtures, scores, odds, standings and team statistics are provided by API-Sports (API-Football).</p>

      <h2>Bet responsibly</h2>
      <p>
        Our content is for adults aged 18 and over. Predictions are opinions based on data, not certainties. Please read our{" "}
        <Link href="/responsible-betting">responsible betting guide</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, corrections or feedback: <Link href="/contact">contact us</Link>.
      </p>
    </LegalPage>
  );
}
