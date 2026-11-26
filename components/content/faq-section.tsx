import { JsonLd } from "@/components/seo/json-ld";
import { PlainContent } from "@/components/content/plain-content";
import { plainTextOf } from "@/lib/content/plain-text";
import { faqJsonLd } from "@/lib/seo";
import type { FaqItem } from "@/types/database";

/** Visible FAQ with matching FAQPage structured data (same questions, same answers). */
export function FaqSection({ items, heading = "Frequently asked questions" }: { items: FaqItem[]; heading?: string }) {
  const valid = items.filter((i) => i.question?.trim() && i.answer?.trim());
  if (valid.length === 0) return null;
  return (
    <section aria-labelledby="faq" className="mt-10">
      <h2 id="faq" className="text-lg font-bold">
        {heading}
      </h2>
      <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        {valid.map((item) => (
          <details key={item.question} className="group p-4 [&_summary::-webkit-details-marker]:hidden" open>
            <summary className="cursor-pointer list-none font-medium">
              <h3 className="inline">{item.question}</h3>
            </summary>
            {/* Answers may use the plain-text format (bold, links, lists); structured data gets plain text. */}
            <PlainContent text={item.answer} className="mt-2 text-sm text-muted-foreground" />
          </details>
        ))}
      </div>
      <JsonLd data={faqJsonLd(valid.map((i) => ({ question: i.question, answer: plainTextOf(i.answer) })))} />
    </section>
  );
}
