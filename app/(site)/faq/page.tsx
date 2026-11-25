import Link from "next/link";
import type { Metadata } from "next";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/site/legal-page";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = pageMetadata({
  title: "FAQ – Football Predictions Questions Answered",
  description:
    "Answers to common questions about SureMatchContact: whether tips are free, how predictions are chosen, what confidence means, how results are verified and more.",
  path: "/faq",
});

const FAQS = [
  {
    question: "Are SureMatchContact predictions free?",
    answer: "Yes. Every prediction, match page and article is free to read. There are no subscriptions, paid tips or locked content.",
  },
  {
    question: "How are the predictions chosen?",
    answer:
      "Most picks are selected automatically from bookmaker odds using published rules — for example, the more likely side of each market within a fixed odds range. Editors also add their own picks. The methodology page lists the exact rules.",
  },
  {
    question: "What does the confidence percentage mean?",
    answer:
      "For automatic picks it is the bookmaker's implied probability (100 divided by the decimal odds). For editorial picks it is the editor's rating. It helps rank picks; it is not a guarantee.",
  },
  {
    question: "How accurate are your predictions?",
    answer:
      "Our Previous Results page shows every verified result, including losses, with win rates for the last 7 days, 30 days and all time. No prediction service can guarantee outcomes.",
  },
  {
    question: "When are predictions published?",
    answer:
      "Picks for today, tomorrow and the day after are added automatically through the day, always before kickoff. Times on the site are shown in West Africa Time (WAT).",
  },
  {
    question: "How are results checked?",
    answer:
      "Final scores come from API-Sports and each pick is graded automatically on the 90-minute result. Results count in our statistics once the match is final, losses included.",
  },
  {
    question: "Do you take bets?",
    answer: "No. SureMatchContact is an information site, not a bookmaker. We do not accept bets or handle money.",
  },
  {
    question: "How do I report a mistake?",
    answer: "Use the contact page. We correct errors promptly, and if a result was affected the statistics are updated too.",
  },
];

export default function FaqPage() {
  return (
    <LegalPage title="Frequently Asked Questions" path="/faq" updated="2026-11-25">
      <JsonLd data={faqJsonLd(FAQS)} />
      {FAQS.map((faq) => (
        <section key={faq.question}>
          <h2>{faq.question}</h2>
          <p>{faq.answer}</p>
        </section>
      ))}
      <p>
        More detail: <Link href="/methodology">how our predictions work</Link> ·{" "}
        <Link href="/responsible-betting">responsible betting</Link>
      </p>
    </LegalPage>
  );
}
