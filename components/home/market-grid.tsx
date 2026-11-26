import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { applyMarketSelection } from "@/lib/seo/market-pages";
import { getMarketPagesWithText, getSiteText } from "@/lib/content/site-text";
import { plainTextOf } from "@/lib/content/plain-text";
import type { PublicPrediction } from "@/lib/data/predictions";

/** Market cards with today's real pick counts. */
export async function MarketGrid({ predictions, slugs }: { predictions: PublicPrediction[]; slugs?: string[] }) {
  const [text, markets] = await Promise.all([getSiteText(), getMarketPagesWithText()]);
  const pages = slugs ? slugs.map(markets.bySlug).filter((p) => p !== undefined) : markets.pages;

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {pages.map((page) => {
        const count = applyMarketSelection(predictions, page.selection).length;
        return (
          <li key={page.slug}>
            <Link
              href={`/tips/${page.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand/50"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold group-hover:text-brand">{page.h1.replace(/ Today.*$/, "").replace(/:.*$/, "")}</span>
                <ArrowRight aria-hidden className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{plainTextOf(page.intro)}</span>
              <span className="mt-3 text-xs font-medium text-muted-foreground">
                {count === 0 ? text.t("cards.noPicksToday") : count === 1 ? text.t("cards.onePickToday") : text.t("cards.picksToday", { count })}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
