import type { PredictionResult } from "@/types/database";

/**
 * Best-effort auto-grading from free-text `prediction_type` + final score.
 * Returns null when the pick doesn't match a recognized pattern (e.g. an
 * admin typed something bespoke) -- callers should leave the result as
 * `pending` for manual grading in that case rather than guessing.
 */
export function gradePrediction(
  predictionType: string,
  homeScore: number,
  awayScore: number
): PredictionResult | null {
  const type = predictionType.trim().toLowerCase();

  const scoreline = predictionType.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (scoreline) {
    const [, home, away] = scoreline;
    return Number(home) === homeScore && Number(away) === awayScore ? "win" : "loss";
  }

  if (type === "home win" || type === "1") {
    return homeScore > awayScore ? "win" : "loss";
  }
  if (type === "away win" || type === "2") {
    return awayScore > homeScore ? "win" : "loss";
  }
  if (type === "draw" || type === "x") {
    return homeScore === awayScore ? "win" : "loss";
  }
  if (type === "double chance 1x" || type === "1x") {
    return homeScore >= awayScore ? "win" : "loss";
  }
  if (type === "double chance x2" || type === "x2") {
    return awayScore >= homeScore ? "win" : "loss";
  }
  if (type === "double chance 12" || type === "12") {
    return homeScore !== awayScore ? "win" : "loss";
  }
  if (type.includes("btts") || type.includes("both teams")) {
    const bothScored = homeScore > 0 && awayScore > 0;
    const negated = type.includes("no") || type.includes("not");
    return (negated ? !bothScored : bothScored) ? "win" : "loss";
  }

  const overUnder = type.match(/(over|under)\s*(\d+(?:\.\d+)?)/);
  if (overUnder) {
    const [, direction, lineStr] = overUnder;
    const line = Number(lineStr);
    const totalGoals = homeScore + awayScore;
    const isOver = totalGoals > line;
    return (direction === "over" ? isOver : !isOver) ? "win" : "loss";
  }

  return null;
}
