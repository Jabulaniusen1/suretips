import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer">
      <p>
        Sureodds Predict provides football predictions for informational and entertainment purposes only. We
        are not a bookmaker, and nothing on this site constitutes financial or betting advice.
      </p>
      <h2>No Guarantees</h2>
      <p>
        Sports outcomes are inherently unpredictable. Past performance shown on our Previous Results page is
        not a guarantee of future results.
      </p>
      <h2>Age Restriction</h2>
      <p>This service is intended for users who are of legal betting age in their jurisdiction. Betting laws vary by country — you are responsible for complying with local regulations.</p>
      <h2>Responsible Gambling</h2>
      <p>If you or someone you know has a gambling problem, please seek help from a local responsible-gambling support organization.</p>
    </LegalPage>
  );
}
