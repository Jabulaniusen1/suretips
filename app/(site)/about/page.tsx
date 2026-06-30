import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <LegalPage title="About Sureodds Predict">
      <p>
        Sureodds Predict is a football prediction service built on one principle: show your work. We publish
        every prediction we make and every result that follows — wins and losses alike — so you can judge our
        accuracy for yourself before you ever subscribe.
      </p>
      <p>
        Our team combines statistical analysis with football expertise to produce daily odds combos and
        correct-score predictions across major leagues and competitions worldwide. We believe trust is earned
        through a transparent track record, not marketing claims.
      </p>
      <h2>Our Mission</h2>
      <p>
        To give bettors of every experience level access to accurate, well-researched football predictions,
        backed by a verifiable history they can check at any time on our Previous Results page.
      </p>
      <h2>Responsible Betting</h2>
      <p>
        Football predictions are for informational and entertainment purposes. No prediction service can
        guarantee outcomes. Please bet responsibly and within your means.
      </p>
    </LegalPage>
  );
}
