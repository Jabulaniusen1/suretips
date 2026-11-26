import Link from "next/link";
import { cn } from "@/lib/utils";
import { getMarketPagesWithText, getSiteText } from "@/lib/content/site-text";

/**
 * Crawlable navigation between market pages. "All tips" is the homepage,
 * which owns the general "football predictions today" intent.
 */
export async function MarketNav({ active }: { active: string | "all" }) {
  // Labels are edited in Admin > Site Content (each market's "Tab & menu label").
  const [text, markets] = await Promise.all([getSiteText(), getMarketPagesWithText()]);
  const items = [
    { href: "/", label: text.t("chips.allTips"), key: "all" },
    ...markets.pages.map((p) => ({ href: `/tips/${p.slug}`, label: p.tabLabel, key: p.slug })),
  ];

  return (
    // Wraps onto several rows on every screen size, so all markets stay visible
    // (on phones the chips are a little smaller to keep the block compact).
    <nav aria-label="Prediction markets">
      <ul className="flex flex-wrap gap-1.5 sm:gap-2">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
              className={cn(
                "block whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium leading-5 transition-colors sm:px-3.5 sm:text-sm",
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
