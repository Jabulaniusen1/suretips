import { GOAL_LINE_RE, classifyMarket } from "@/lib/predictions/markets";
import type { PredictionResult } from "@/types/database";

/**
 * Grades a pick from the regular-time score (90 minutes plus stoppage time),
 * which is how bookmakers settle these markets. For matches that went to
 * extra time, pass API-Sports' `score.fulltime`, not `goals` (which includes
 * extra-time goals) -- see lib/predictions/update-scores.ts.
 *
 * Returns null when the pick doesn't belong to a recognised market -- the
 * caller must leave the result `pending` for manual grading rather than
 * guessing.
 */
export function gradePrediction(
  predictionType: string,
  homeScore: number,
  awayScore: number
): Exclude<PredictionResult, "pending"> | null {
  const type = predictionType.trim().toLowerCase();
  const total = homeScore + awayScore;
  const bothScored = homeScore > 0 && awayScore > 0;
  const outcome = (won: boolean): "win" | "loss" => (won ? "win" : "loss");

  const market = classifyMarket(predictionType);

  switch (market) {
    case "correct_score": {
      const [, home, away] = type.match(/^(\d+)\s*[-:]\s*(\d+)$/) ?? [];
      return outcome(Number(home) === homeScore && Number(away) === awayScore);
    }
    case "home_win":
      return outcome(homeScore > awayScore);
    case "away_win":
      return outcome(awayScore > homeScore);
    case "draw":
      return outcome(homeScore === awayScore);
    case "double_chance_12":
      return outcome(homeScore !== awayScore);
    case "double_chance": {
      if (/\b1x\b/.test(type) || type.includes("home/draw")) return outcome(homeScore >= awayScore);
      if (/\bx2\b/.test(type) || type.includes("draw/away")) return outcome(awayScore >= homeScore);
      return null; // "Double Chance" without a side can't be graded
    }
    case "btts":
      return outcome(bothScored);
    case "btts_no":
      return outcome(!bothScored);
    default:
      break;
  }

  // Supported over/under markets plus other match goal lines (e.g. Over 4.5).
  // Only when the whole pick is a goal line: "Over 9.5 Corners" or "First Half
  // Over 0.5" can't be settled from the full-time score.
  const overUnder = type.match(GOAL_LINE_RE);
  if (overUnder) {
    const [, direction, lineStr] = overUnder;
    const line = Number(lineStr);
    if (Number.isInteger(line) && total === line) return "push"; // whole-number lines refund
    return outcome(direction === "over" ? total > line : total < line);
  }

  return null;
}
