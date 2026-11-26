import type { Metadata } from "next";
import { EditableLongPage, longPageMetadata } from "@/components/site/editable-long-page";
import { ODDS_WINDOWS, DRAW_MIN_SIDE_ODDS } from "@/lib/predictions/pick-selection";
import { MARKET_LABELS, type MarketKey } from "@/lib/predictions/markets";

// Heading, intro, text and SEO fields are edited in Admin > Site Content. The
// odds-window table ({{odds-table}}) and {draw_min_odds} always come from the
// live selection rules, so they can't drift from what the code does.
export async function generateMetadata(): Promise<Metadata> {
  return longPageMetadata("methodology");
}

const WINDOW_ROWS = Object.entries(ODDS_WINDOWS) as Array<[Exclude<MarketKey, "correct_score">, readonly [number, number]]>;

function OddsWindowTable() {
  return (
    <div className="not-prose overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <th scope="col" className="px-4 py-2">Market</th>
            <th scope="col" className="px-4 py-2">Odds window</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {WINDOW_ROWS.map(([market, [min, max]]) => (
            <tr key={market}>
              <td className="px-4 py-2">{MARKET_LABELS[market]}</td>
              <td className="px-4 py-2 tabular-nums">
                {min.toFixed(2)} – {max.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MethodologyPage() {
  return <EditableLongPage slug="methodology" vars={{ draw_min_odds: DRAW_MIN_SIDE_ODDS.toFixed(2) }} blocks={{ "odds-table": <OddsWindowTable /> }} />;
}
