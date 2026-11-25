import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Responsible Betting – Stay in Control",
  description:
    "Football predictions are never guaranteed. How to bet responsibly, warning signs of problem gambling, tools that help you stay in control and where to get support.",
  path: "/responsible-betting",
});

export default function ResponsibleBettingPage() {
  return (
    <LegalPage
      title="Responsible Betting"
      path="/responsible-betting"
      updated="2026-11-19"
      intro="Betting should be an occasional form of entertainment, never a way to make money or solve money problems. Our predictions can and do lose."
    >
      <h2>18+ only</h2>
      <p>
        SureMatchContact is intended for adults aged 18 or over, or the legal betting age where you live if that is higher. Betting
        laws differ between countries; make sure betting is legal for you before you bet.
      </p>

      <h2>No prediction is guaranteed</h2>
      <p>
        Confidence figures and odds describe likelihood, not certainty. A pick rated at 75% is still expected to lose one time in
        four, and losing runs happen to every tipster. Read{" "}
        <Link href="/methodology">how our predictions work</Link> to understand what the numbers mean.
      </p>

      <h2>Stay in control</h2>
      <ul>
        <li>Decide in advance how much you can afford to lose, and treat that money as spent.</li>
        <li>Never chase losses by raising your stakes to win money back.</li>
        <li>Don&apos;t bet when you are upset, stressed or have been drinking.</li>
        <li>Never borrow money, or use money meant for bills, rent or food, to bet.</li>
        <li>Remember that accumulators multiply the chance of losing as well as the odds.</li>
        <li>Take regular breaks, and keep betting separate from the rest of your life.</li>
      </ul>

      <h2>Tools that help</h2>
      <p>Most licensed bookmakers offer tools you can switch on in your account settings:</p>
      <ul>
        <li>Deposit, loss and time limits</li>
        <li>Reality checks that remind you how long you have been playing</li>
        <li>Time-outs and self-exclusion, which block your account for a period you choose</li>
      </ul>

      <h2>Warning signs</h2>
      <p>It may be time to stop and talk to someone if you:</p>
      <ul>
        <li>Spend more money or time on betting than you intended</li>
        <li>Feel anxious, irritable or low when you are not betting</li>
        <li>Hide your betting from family or friends</li>
        <li>Bet to escape problems or to win back losses</li>
        <li>Borrow money or sell things to fund betting</li>
      </ul>

      <h2>Get support</h2>
      <p>Free, confidential help is available:</p>
      <ul>
        <li>
          <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer">
            Gamblers Anonymous
          </a>{" "}
          — peer support groups in many countries
        </li>
        <li>
          <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer">
            GamCare
          </a>{" "}
          — advice, support and online chat
        </li>
        <li>
          <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer">
            BeGambleAware
          </a>{" "}
          — information and self-assessment tools
        </li>
      </ul>
      <p>
        You can also speak to a doctor or a local counselling service. If you are worried about someone else&apos;s betting,
        these organisations can help you too.
      </p>
    </LegalPage>
  );
}
