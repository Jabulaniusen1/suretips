import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMarket } from "@/lib/predictions/markets";

const CASES: Array<[string, string | null]> = [
  ["Home Win", "home_win"],
  ["Away Win", "away_win"],
  ["Draw", "draw"],
  ["Double Chance 1X", "double_chance"],
  ["Double Chance X2", "double_chance"],
  ["Double Chance 12", "double_chance_12"],
  ["12", "double_chance_12"],
  ["BTTS", "btts"],
  ["BTTS Yes", "btts"],
  ["GG", "btts"],
  ["BTTS No", "btts_no"],
  ["Both teams not to score", "btts_no"],
  ["NG", "btts_no"],
  ["Over 0.5 Goals", "over_0_5"],
  ["Over 1.5 Goals", "over_1_5"],
  ["Over 2.5", "over_2_5"],
  ["Over 3.5 Goals", "over_3_5"],
  ["Under 2.5 Goals", "under_2_5"],
  ["Under 3.5 Goals", "under_3_5"],
  ["2-1", "correct_score"],
  ["1:0", "correct_score"],
  ["Over 4.5", null],
  ["Asian Handicap -1", null],
  // Combined, half-time and non-goal picks are bespoke (graded by hand).
  ["Home Win & Over 1.5", null],
  ["Over 2.5 & BTTS", null],
  ["Double Chance 1X + Over 1.5", null],
  ["BTTS and Over 2.5", null],
  ["First Half Over 0.5", null],
  ["HT/FT 1/1", null],
  ["BTTS 2nd Half", null],
  ["Over 9.5 Corners", null],
  ["Over 3.5 Cards", null],
  ["Home Over 1.5", null],
  ["Total Over 2.5", "over_2_5"],
  ["over2.5 goals", "over_2_5"],
  ["Both Teams To Score - No", "btts_no"],
  ["Double Chance 12", "double_chance_12"],
];

test("classifyMarket matches the SQL classifier cases", () => {
  for (const [input, expected] of CASES) assert.equal(classifyMarket(input), expected, input);
});
