import Link from "next/link";
import { cn } from "@/lib/utils";
import { MARKET_PAGES } from "@/lib/seo/market-pages";

/**
 * Crawlable navigation between market pages. "All tips" is the homepage,
 * which owns the general "football predictions today" intent.
 */
export function MarketNav({ active }: { active: string | "all" }) {
  const items = [{ href: "/", label: "All Tips", key: "all" }, ...MARKET_PAGES.map((p) => ({ href: `/tips/${p.slug}`, label: p.tabLabel, key: p.slug }))];

  return (
    <nav aria-label="Prediction markets" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
              className={cn(
                "block whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active === item.key
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-brand/50 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
