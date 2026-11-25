import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeResults } from "@/lib/predictions/stats";
import { addDaysToKey, getDateRange, lagosDateKey, lagosDayRange, parseDateKey } from "@/lib/utils/date";

test("only approved results count; pushes excluded from win rate", () => {
  const s = summarizeResults([
    { result: "win", result_approved: true },
    { result: "win", result_approved: true },
    { result: "loss", result_approved: true },
    { result: "push", result_approved: true },
    { result: "win", result_approved: false },
    { result: "pending", result_approved: false },
  ]);
  assert.deepEqual(
    { wins: s.wins, losses: s.losses, pushes: s.pushes, pending: s.pending, awaiting: s.awaitingVerification, settled: s.settled, total: s.total },
    { wins: 2, losses: 1, pushes: 1, pending: 2, awaiting: 1, settled: 4, total: 6 }
  );
  assert.equal(s.winRate, 66.7);
  assert.equal(summarizeResults([{ result: "push", result_approved: true }]).winRate, null);
});

test("Lagos day boundaries are UTC+1", () => {
  assert.deepEqual(lagosDayRange("2026-11-19"), { from: "2026-11-18T23:00:00.000Z", to: "2026-11-19T22:59:59.999Z" });
  assert.equal(lagosDateKey(new Date("2026-11-19T23:30:00Z")), "2026-11-20");
  assert.equal(lagosDateKey(new Date("2026-11-19T22:30:00Z")), "2026-11-19");
  assert.equal(addDaysToKey("2026-12-31", 1), "2027-01-01");
});

test("date params are validated", () => {
  assert.equal(parseDateKey("2026-02-30"), null);
  assert.equal(parseDateKey("2026-11-19"), "2026-11-19");
  assert.equal(parseDateKey("<script>"), null);
  assert.equal(getDateRange("bogus").period, "today");
  assert.equal(getDateRange(undefined, "2026-01-05").dateKey, "2026-01-05");
  assert.equal(getDateRange("tomorrow").dateKey, addDaysToKey(lagosDateKey(), 1));
});
