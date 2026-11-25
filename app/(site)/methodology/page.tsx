import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/site/legal-page";
import { ODDS_WINDOWS, DRAW_MIN_SIDE_ODDS } from "@/lib/predictions/pick-selection";
import { MARKET_LABELS, type MarketKey } from "@/lib/predictions/markets";

export const metadata: Metadata = pageMetadata({
  title: "How Our Football Predictions Work – Methodology",
  description:
    "How Sure Match Tips selects football predictions, what confidence ratings mean, how odds are shown, how results are verified and how win rates are calculated.",
  path: "/methodology",
});

const WINDOW_ROWS = Object.entries(ODDS_WINDOWS) as Array<[Exclude<MarketKey, "correct_score">, readonly [number, number]]>;

export default function MethodologyPage() {
  return (
    <LegalPage
      title="How Our Predictions Work"
      path="/methodology"
      updated="2026-11-25"
      intro="This page explains exactly how predictions on Sure Match Tips are produced, what the numbers next to them mean, and how we keep score. If anything here and the site disagree, tell us."
    >
      <h2 id="sources">Two kinds of prediction</h2>
      <p>Every prediction is labelled internally by where it came from:</p>
      <ul>
        <li>
          <strong>Automatic picks</strong> are selected by software from bookmaker odds supplied by API-Sports, for fixtures in
          competitions with reliable odds coverage. They are not the output of a proprietary forecasting model — they are a
          transparent, rule-based reading of what the betting market already prices as likely.
        </li>
        <li>
          <strong>Editorial picks</strong> are added by our editors, who may also write a short explanation.
          {/* DISABLED (correct score): " Correct score predictions are always editorial." */}
        </li>
      </ul>

      <h2 id="selection">How automatic picks are selected</h2>
      <p>For each upcoming fixture we read the bookmaker prices for the match result, double chance, both teams to score and total goals markets, then:</p>
      <ul>
        <li>For each pair of opposing outcomes we only consider the more likely side, so a match never receives contradictory picks such as Over 2.5 and Under 2.5.</li>
        <li>
          A pick is only published if its odds fall inside a fixed window for that market (below). Very short odds carry little
          information; very long odds are too speculative for a daily tip.
        </li>
        <li>Draws are only considered when both teams are priced at {DRAW_MIN_SIDE_ODDS.toFixed(2)} or longer — a sign of a genuinely balanced match.</li>
        <li>Picks are published at least 15 minutes before kickoff, and never for a match that has already started.</li>
      </ul>
      <div className="not-prose overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <th scope="col" className="px-4 py-2">Market</th>
              <th scope="col" className="px-4 py-2">Odds window</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {WINDOW_ROWS.map(([market, [min, max]]) => (
              <tr key={market}>
                <td className="px-4 py-2">{MARKET_LABELS[market]}</td>
                <td className="px-4 py-2 tabular-nums">
                  {min.toFixed(2)} – {max.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="confidence">What confidence means</h2>
      <p>
        For automatic picks, the confidence figure is the bookmaker&apos;s <strong>implied probability</strong>: 100 divided by
        the decimal odds, rounded. Odds of 1.60 give a confidence of 63%. Implied probabilities include the bookmaker&apos;s
        margin, so they slightly overstate the true chance of an outcome. For editorial picks, confidence is the editor&apos;s own
        rating on the same 0–100 scale.
      </p>
      <p>
        Confidence is a way to rank picks against each other. It is <strong>not</strong> a calibrated forecast and not a promise:
        an outcome rated at 70% is expected to fail roughly three times in ten.
      </p>

      <h2 id="odds">How odds are shown</h2>
      <p>
        Odds are decimal bookmaker prices supplied by API-Sports, recorded when the pick was published. Each market&apos;s price
        comes from a single bookmaker — our configured bookmaker where it offers that market, otherwise the bookmaker with the
        widest coverage for the fixture. Prices move, and your bookmaker may offer different odds. We never change the odds
        shown for a pick after kickoff.
      </p>

      <h2 id="results">How results are verified</h2>
      <ol>
        <li>Final scores are fetched from API-Sports after full time.</li>
        <li>Picks are graded automatically on the score after 90 minutes plus stoppage time — extra time and penalties do not count, which is how bookmakers settle these markets.</li>
        <li>Matches that are cancelled, abandoned or awarded are marked void.</li>
        <li>Graded results count in the statistics as soon as the match is final. A pick that can&apos;t be graded from the score stays pending and does not count in any statistic.</li>
      </ol>
      <p>
        The selection and odds of a pick are frozen once its match kicks off. Our results pages always show the pick as it was
        published, even if it was later corrected.
      </p>

      <h2 id="win-rate">How win rates are calculated</h2>
      <ul>
        <li>Win rate = wins ÷ (wins + losses), using approved results only.</li>
        <li>Void results are shown separately and excluded from the win rate.</li>
        <li>Each prediction counts once. A match with three published picks contributes three results.</li>
        <li>“Last 7 days” and “last 30 days” are based on kickoff time.</li>
      </ul>
      <p>
        Win rate on its own says nothing about profit: a 75% win rate on picks averaging odds of 1.25 loses money over time. We
        show odds alongside every result so you can judge both.
      </p>

      <h2 id="limitations">Limitations</h2>
      <ul>
        <li>Football is unpredictable. Injuries, red cards, weather and luck decide matches, and no method removes that.</li>
        <li>Automatic picks reflect the betting market&apos;s view, so they will not consistently beat it.</li>
        <li>Team statistics on match pages come from API-Sports and may occasionally be incomplete or delayed.</li>
        <li>Small samples mislead. Judge any record over hundreds of picks, not a good or bad week.</li>
      </ul>

      <p>
        See the full record on <Link href="/previous-results">Previous Results</Link>, read our{" "}
        <Link href="/editorial-standards">editorial standards</Link>, and please read the{" "}
        <Link href="/responsible-betting">responsible betting guide</Link> before you bet.
      </p>
    </LegalPage>
  );
}
