// Performance statistics for published predictions.
//
// Rules (documented publicly on /methodology):
//  * Only results an admin has approved (`result_approved`) are "settled".
//  * Win rate = wins / (wins + losses). Pushes (void / refunded bets) are
//    excluded from the rate but shown separately.
//  * Everything not yet approved is "pending" -- that includes matches not
//    played yet and results graded automatically but not yet verified.

export interface ResultRow {
  result: "win" | "loss" | "push" | "pending";
  result_approved: boolean;
}

export interface ResultSummary {
  total: number;
  wins: number;
  losses: number;
  pushes: number;
  /** Not yet approved (unplayed, ungraded or awaiting verification). */
  pending: number;
  /** Graded but not yet approved -- a subset of `pending`. */
  awaitingVerification: number;
  settled: number;
  /** Percentage with one decimal place, or null when nothing is settled. */
  winRate: number | null;
}

export function summarizeResults(rows: readonly ResultRow[]): ResultSummary {
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let pending = 0;
  let awaitingVerification = 0;

  for (const row of rows) {
    if (!row.result_approved || row.result === "pending") {
      pending += 1;
      if (row.result !== "pending") awaitingVerification += 1;
      continue;
    }
    if (row.result === "win") wins += 1;
    else if (row.result === "loss") losses += 1;
    else pushes += 1;
  }

  const decided = wins + losses;
  return {
    total: rows.length,
    wins,
    losses,
    pushes,
    pending,
    awaitingVerification,
    settled: decided + pushes,
    winRate: decided > 0 ? Math.round((wins / decided) * 1000) / 10 : null,
  };
}

export function formatWinRate(winRate: number | null): string {
  return winRate === null ? "—" : `${winRate.toFixed(1)}%`;
}
