import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MARKET_PAGES, applyMarketSelection, getMarketPage } from "@/lib/seo/market-pages";
import type { PublicPrediction } from "@/lib/data/predictions";

/** Market cards with today's real pick counts. */
export function MarketGrid({ predictions, slugs }: { predictions: PublicPrediction[]; slugs?: string[] }) {
  const pages = slugs ? slugs.map(getMarketPage).filter((p) => p !== undefined) : MARKET_PAGES;

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
              <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{page.intro}</span>
              <span className="mt-3 text-xs font-medium text-muted-foreground">
                {count > 0 ? `${count} ${count === 1 ? "pick" : "picks"} today` : "No picks yet today"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
