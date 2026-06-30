import { formatShortDate } from "@/lib/utils/date";
import { ResultBadge } from "@/components/winnings/result-badge";
import type { Tables } from "@/types/database";

export function WinningsTable({ entries, emptyLabel = "No results recorded for this date yet." }: {
  entries: Tables<"vip_winnings">[];
  emptyLabel?: string;
}) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Match</th>
            <th className="py-2 pr-4 font-medium">Pick</th>
            <th className="py-2 pr-4 font-medium">Result</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">{formatShortDate(entry.date)}</td>
              <td className="py-3 pr-4 font-medium">
                {entry.home_team} <span className="text-muted-foreground">vs</span> {entry.away_team}
              </td>
              <td className="py-3 pr-4">{entry.prediction_type}</td>
              <td className="py-3 pr-4 text-muted-foreground">
                {entry.home_score !== null && entry.away_score !== null ? `${entry.home_score} - ${entry.away_score}` : "—"}
              </td>
              <td className="py-3">
                <ResultBadge result={entry.result} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
