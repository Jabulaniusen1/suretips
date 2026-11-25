import { test } from "node:test";
import assert from "node:assert/strict";
import { gradePrediction } from "@/lib/utils/prediction-grading";

test("match result markets", () => {
  assert.equal(gradePrediction("Home Win", 2, 1), "win");
  assert.equal(gradePrediction("Home Win", 1, 1), "loss");
  assert.equal(gradePrediction("Away Win", 0, 1), "win");
  assert.equal(gradePrediction("Draw", 2, 2), "win");
  assert.equal(gradePrediction("Draw", 2, 1), "loss");
});

test("double chance", () => {
  assert.equal(gradePrediction("Double Chance 1X", 1, 1), "win");
  assert.equal(gradePrediction("Double Chance 1X", 0, 1), "loss");
  assert.equal(gradePrediction("Double Chance X2", 0, 0), "win");
  assert.equal(gradePrediction("Double Chance X2", 2, 0), "loss");
  assert.equal(gradePrediction("Double Chance 12", 1, 1), "loss");
  assert.equal(gradePrediction("Double Chance 12", 3, 1), "win");
  assert.equal(gradePrediction("Double Chance", 1, 0), null, "side unknown -> manual");
});

test("both teams to score", () => {
  assert.equal(gradePrediction("BTTS Yes", 1, 1), "win");
  assert.equal(gradePrediction("BTTS", 1, 0), "loss");
  assert.equal(gradePrediction("BTTS No", 1, 0), "win");
  assert.equal(gradePrediction("BTTS No", 2, 2), "loss");
  assert.equal(gradePrediction("GG", 0, 0), "loss");
  assert.equal(gradePrediction("NG", 0, 0), "win");
});

test("goal lines, including unsupported half lines and whole-line pushes", () => {
  assert.equal(gradePrediction("Over 2.5 Goals", 2, 1), "win");
  assert.equal(gradePrediction("Over 2.5 Goals", 1, 1), "loss");
  assert.equal(gradePrediction("Under 2.5 Goals", 1, 1), "win");
  assert.equal(gradePrediction("Under 3.5 Goals", 2, 2), "loss");
  assert.equal(gradePrediction("Over 0.5 Goals", 0, 0), "loss");
  assert.equal(gradePrediction("Over 4.5", 3, 2), "win");
  assert.equal(gradePrediction("Over 2", 1, 1), "push");
});

test("correct score and unknown picks", () => {
  assert.equal(gradePrediction("2-1", 2, 1), "win");
  assert.equal(gradePrediction("2-1", 1, 2), "loss");
  assert.equal(gradePrediction("Asian Handicap -1", 2, 0), null);
});

test("combined, half-time and non-goal picks are left for manual grading", () => {
  // Previously graded on one leg / the full-time goals total.
  assert.equal(gradePrediction("Home Win & Over 1.5", 0, 2), null);
  assert.equal(gradePrediction("Over 2.5 & BTTS", 2, 1), null);
  assert.equal(gradePrediction("First Half Over 0.5", 1, 0), null);
  assert.equal(gradePrediction("Over 9.5 Corners", 1, 0), null);
  assert.equal(gradePrediction("Over 3.5 Cards", 2, 2), null);
  assert.equal(gradePrediction("Total Over 2.5", 2, 1), "win");
  assert.equal(gradePrediction("over2.5", 1, 1), "loss");
});
