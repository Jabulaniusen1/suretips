import { siteOrigin } from "@/lib/env";
import { MARKET_GROUP_ORDER, MARKET_PAGES } from "@/lib/seo/market-pages";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

// A plain-text guide to the site for LLM-based tools (https://llmstxt.org).
// It summarises and links to the same public HTML pages -- it is not a
// separate copy of the content.
export const revalidate = 86400;

export function GET() {
  const origin = siteOrigin();
  const markets = MARKET_GROUP_ORDER.flatMap((group) =>
    MARKET_PAGES.filter((p) => p.group === group).map((p) => `- [${p.h1}](${origin}/tips/${p.slug}): ${p.intro}`)
  );

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

All predictions are free. Kickoff times are shown in West Africa Time (WAT, UTC+1). Predictions are not guarantees; see the methodology page for how picks are selected, what confidence means and how results are verified.

## Core pages

- [Football predictions today](${origin}/): today's free predictions across all markets
- [Football predictions tomorrow](${origin}/predictions): upcoming predictions for the next two days
- [Betting tips by market](${origin}/tips): every market we cover
- [Previous results](${origin}/previous-results): verified record of published predictions, wins and losses
- [Competitions](${origin}/competitions): league and tournament hubs with fixtures and standings
- [Blog](${origin}/blog): guides and analysis

## Markets

${markets.join("\n")}

## Trust and methodology

- [How our predictions work](${origin}/methodology)
- [Editorial standards](${origin}/editorial-standards)
- [Responsible betting](${origin}/responsible-betting)
- [About](${origin}/about)
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
