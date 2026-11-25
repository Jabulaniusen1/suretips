import type { MarketKey } from "@/lib/predictions/markets";

// Rules that turn one fixture's bookmaker odds into automatically published
// picks. Described in plain language on /methodology -- keep both in sync.
//
// For every market pair the more likely side (lower odds) is chosen, so a
// fixture never receives contradictory picks (Home Win + Away Win, Over 2.5
// + Under 2.5, BTTS Yes + BTTS No, Draw + Double Chance 12, Over 3.5 + Under
// 3.5). Each market only accepts odds inside a window: very short odds carry
// little information, very long odds are too speculative for a daily tip.

export interface CandidatePick {
  market: MarketKey;
  predictionType: string;
  odds: number;
  /** Bookmaker implied probability in percent (1 / odds), rounded. */
  confidence: number;
}

export interface BetLike {
  name: string;
  values: Array<{ value: string; odd: string }>;
}

export const ODDS_WINDOWS: Record<Exclude<MarketKey, "correct_score">, readonly [number, number]> = {
  home_win: [1.3, 2.6],
  away_win: [1.3, 3.2],
  draw: [2.6, 3.4],
  double_chance: [1.1, 1.7],
  double_chance_12: [1.15, 1.5],
  btts: [1.4, 2.3],
  btts_no: [1.4, 2.3],
  over_0_5: [1.03, 1.15],
  over_1_5: [1.1, 1.7],
  over_2_5: [1.4, 2.3],
  over_3_5: [1.8, 3.0],
  under_2_5: [1.4, 2.3],
  under_3_5: [1.15, 1.6],
};

/** Balanced-match threshold for draw picks: both sides at or above this price. */
export const DRAW_MIN_SIDE_ODDS = 2.4;

const CORE_BETS = ["Match Winner", "Double Chance", "Both Teams Score", "Goals Over/Under"];

/**
 * API-Sports returns many bookmakers per fixture and they don't all offer the
 * same markets (some have no "Goals Over/Under" at all). Take each market from
 * a single bookmaker: the preferred one if it offers it (API_FOOTBALL_BOOKMAKER_ID),
 * otherwise the bookmaker that covers the most core markets.
 */
export function mergeBookmakerBets(
  bookmakers: ReadonlyArray<{ id: number; bets: readonly BetLike[] }>,
  preferredId?: number | null
): BetLike[] {
  const coverage = (b: { bets: readonly BetLike[] }) => CORE_BETS.filter((name) => b.bets.some((bet) => bet.name === name)).length;
  const ranked = [...bookmakers].sort((a, b) => {
    if (preferredId && a.id === preferredId) return -1;
    if (preferredId && b.id === preferredId) return 1;
    return coverage(b) - coverage(a);
  });

  const merged = new Map<string, BetLike>();
  for (const bookmaker of ranked) {
    for (const bet of bookmaker.bets) if (!merged.has(bet.name)) merged.set(bet.name, bet);
  }
  return [...merged.values()];
}

export function impliedProbability(odds: number): number {
  return Math.max(1, Math.min(99, Math.round(100 / odds)));
}

function oddFor(bets: readonly BetLike[], betName: string, value: string): number | null {
  const raw = bets.find((b) => b.name === betName)?.values.find((v) => v.value === value)?.odd;
  const odd = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(odd) && odd > 1 ? odd : null;
}

function inWindow(market: keyof typeof ODDS_WINDOWS, odd: number | null): odd is number {
  if (odd === null) return false;
  const [min, max] = ODDS_WINDOWS[market];
  return odd >= min && odd <= max;
}

export function selectPicksFromOdds(bets: readonly BetLike[]): CandidatePick[] {
  const picks: CandidatePick[] = [];
  const add = (market: MarketKey, predictionType: string, odds: number) =>
    picks.push({ market, predictionType, odds, confidence: impliedProbability(odds) });

  // --- Match result: back the favourite only ---------------------------------
  const home = oddFor(bets, "Match Winner", "Home");
  const draw = oddFor(bets, "Match Winner", "Draw");
  const away = oddFor(bets, "Match Winner", "Away");

  // Draw only in genuinely balanced matches -- and then no home/away win pick
  // for the same match, so the site never publishes two contradictory results.
  let drawPicked = false;
  if (home !== null && away !== null && home >= DRAW_MIN_SIDE_ODDS && away >= DRAW_MIN_SIDE_ODDS && inWindow("draw", draw)) {
    add("draw", "Draw", draw);
    drawPicked = true;
  }

  if (home !== null && away !== null && !drawPicked) {
    if (home <= away && inWindow("home_win", home)) add("home_win", "Home Win", home);
    else if (away < home && inWindow("away_win", away)) add("away_win", "Away Win", away);
  }

  // --- Double chance ------------------------------------------------------
  const homeDraw = oddFor(bets, "Double Chance", "Home/Draw");
  const drawAway = oddFor(bets, "Double Chance", "Draw/Away");
  const homeAway = oddFor(bets, "Double Chance", "Home/Away");

  if (homeDraw !== null && (drawAway === null || homeDraw <= drawAway)) {
    if (inWindow("double_chance", homeDraw)) add("double_chance", "Double Chance 1X", homeDraw);
  } else if (drawAway !== null && inWindow("double_chance", drawAway)) {
    add("double_chance", "Double Chance X2", drawAway);
  }

  if (!drawPicked && inWindow("double_chance_12", homeAway)) add("double_chance_12", "Double Chance 12", homeAway);

  // --- Both teams to score -----------------------------------------------
  const bttsYes = oddFor(bets, "Both Teams Score", "Yes");
  const bttsNo = oddFor(bets, "Both Teams Score", "No");
  if (bttsYes !== null && (bttsNo === null || bttsYes <= bttsNo)) {
    if (inWindow("btts", bttsYes)) add("btts", "BTTS Yes", bttsYes);
  } else if (bttsNo !== null && inWindow("btts_no", bttsNo)) {
    add("btts_no", "BTTS No", bttsNo);
  }

  // --- Goals ----------------------------------------------------------------
  const goals = "Goals Over/Under";
  const over05 = oddFor(bets, goals, "Over 0.5");
  const over15 = oddFor(bets, goals, "Over 1.5");
  const over25 = oddFor(bets, goals, "Over 2.5");
  const under25 = oddFor(bets, goals, "Under 2.5");
  const over35 = oddFor(bets, goals, "Over 3.5");
  const under35 = oddFor(bets, goals, "Under 3.5");

  if (inWindow("over_0_5", over05)) add("over_0_5", "Over 0.5 Goals", over05);
  if (inWindow("over_1_5", over15)) add("over_1_5", "Over 1.5 Goals", over15);

  const overFavoured = over25 !== null && (under25 === null || over25 <= under25);
  if (overFavoured) {
    if (inWindow("over_2_5", over25)) add("over_2_5", "Over 2.5 Goals", over25);
  } else if (inWindow("under_2_5", under25)) {
    add("under_2_5", "Under 2.5 Goals", under25);
  }

  let over35Picked = false;
  if (overFavoured && inWindow("over_3_5", over35)) {
    add("over_3_5", "Over 3.5 Goals", over35);
    over35Picked = true;
  }
  if (!over35Picked && inWindow("under_3_5", under35)) add("under_3_5", "Under 3.5 Goals", under35);

  return picks;
}
