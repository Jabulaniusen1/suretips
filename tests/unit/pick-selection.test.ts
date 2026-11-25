import { test } from "node:test";
import assert from "node:assert/strict";
import { selectPicksFromOdds, impliedProbability, type BetLike } from "@/lib/predictions/pick-selection";

function bets(spec: Record<string, Record<string, number>>): BetLike[] {
  return Object.entries(spec).map(([name, values]) => ({ name, values: Object.entries(values).map(([value, odd]) => ({ value, odd: String(odd) })) }));
}

test("implied probability is 100 / odds", () => {
  assert.equal(impliedProbability(2), 50);
  assert.equal(impliedProbability(1.6), 63);
  assert.equal(impliedProbability(1.01), 99);
});

test("never publishes contradictory picks for one fixture", () => {
  const picks = selectPicksFromOdds(
    bets({
      "Match Winner": { Home: 2.4, Draw: 3.2, Away: 2.9 },
      "Double Chance": { "Home/Draw": 1.4, "Home/Away": 1.3, "Draw/Away": 1.55 },
      "Both Teams Score": { Yes: 1.8, No: 1.95 },
      "Goals Over/Under": { "Over 0.5": 1.07, "Over 1.5": 1.3, "Over 2.5": 1.9, "Under 2.5": 1.9, "Over 3.5": 3.1, "Under 3.5": 1.35 },
    })
  );
  const markets = picks.map((p) => p.market);
  assert.ok(!(markets.includes("home_win") && markets.includes("away_win")), "home + away");
  assert.ok(!(markets.includes("over_2_5") && markets.includes("under_2_5")), "over + under 2.5");
  assert.ok(!(markets.includes("btts") && markets.includes("btts_no")), "btts yes + no");
  assert.ok(!(markets.includes("over_3_5") && markets.includes("under_3_5")), "over + under 3.5");
  assert.ok(!(markets.includes("draw") && markets.includes("double_chance_12")), "draw + 12");
  assert.equal(new Set(markets).size, markets.length, "one pick per market");
});

test("backs the favourite and respects odds windows", () => {
  const picks = selectPicksFromOdds(bets({ "Match Winner": { Home: 1.5, Draw: 4.2, Away: 6.5 } }));
  assert.deepEqual(
    picks.map((p) => [p.market, p.predictionType, p.odds, p.confidence]),
    [["home_win", "Home Win", 1.5, 67]]
  );
  assert.equal(selectPicksFromOdds(bets({ "Match Winner": { Home: 1.1, Draw: 9, Away: 21 } })).length, 0, "too short to publish");
});

test("draw only for balanced matches", () => {
  const balanced = selectPicksFromOdds(bets({ "Match Winner": { Home: 2.6, Draw: 3.1, Away: 2.8 } }));
  assert.ok(balanced.some((p) => p.market === "draw"));
  const lopsided = selectPicksFromOdds(bets({ "Match Winner": { Home: 1.9, Draw: 3.3, Away: 4.2 } }));
  assert.ok(!lopsided.some((p) => p.market === "draw"));
});

test("ignores malformed odds", () => {
  assert.deepEqual(selectPicksFromOdds([{ name: "Match Winner", values: [{ value: "Home", odd: "abc" }, { value: "Away", odd: "0.5" }] }]), []);
});

test("a balanced match gets a draw pick, never a draw and a win", () => {
  // Home 2.50 / Draw 3.20 / Away 2.90: both sides >= 2.40, draw in window.
  const markets = selectPicksFromOdds(bets({ "Match Winner": { Home: 2.5, Draw: 3.2, Away: 2.9 } })).map((p) => p.market);
  assert.ok(markets.includes("draw"));
  assert.ok(!markets.includes("home_win") && !markets.includes("away_win"), markets.join(","));
  // A clear favourite still gets its win pick.
  assert.deepEqual(selectPicksFromOdds(bets({ "Match Winner": { Home: 1.6, Draw: 3.9, Away: 5.5 } })).map((p) => p.market), ["home_win"]);
});
