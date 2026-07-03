import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "How accurate are your predictions?",
    a: "We publish every result — win or loss — on our Previous Results page so you can check our real track record before subscribing.",
  },
  {
    q: "How do I pay for a VIP package?",
    a: "Choose a package and duration on the Pricing page, then follow the checkout flow to submit proof of payment via bank transfer, mobile money, or crypto. Our team confirms payments manually, usually within a few hours.",
  },
  {
    q: "What is the Correct Scores activation fee?",
    a: "Correct Scores uses a two-step unlock: a subscription fee, then a separate activation fee, before predictions are revealed. This protects the accuracy of our exact-scoreline picks.",
  },
  {
    q: "Can I get a refund?",
    a: "See our Refund Policy page for full details on eligibility and the request process.",
  },
  {
    q: "How do I contact support?",
    a: "Use the Contact Admin option in your dashboard, or email us via the Contact page.",
  },
];

export default function FaqPage() {
  return (
    <LegalPage title="Frequently Asked Questions">
      {FAQS.map((faq) => (
        <div key={faq.q} className="mb-6">
          <h2>{faq.q}</h2>
          <p>{faq.a}</p>
        </div>
      ))}
    </LegalPage>
  );
}
