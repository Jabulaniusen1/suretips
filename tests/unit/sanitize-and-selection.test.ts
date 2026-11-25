import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { MARKET_PAGES, applyMarketSelection, getMarketPage, type SelectablePrediction } from "@/lib/seo/market-pages";
import { indexabilityIssues } from "@/lib/seo/custom-page-rules";

test("sanitizer removes script vectors and keeps formatting", () => {
  const dirty =
    '<p style="text-align: center; background: url(x)">Hi <strong>there</strong></p><script>alert(1)</script>' +
    '<img src=x onerror=alert(1)><a href="javascript:alert(1)">x</a><a href="jav&#x09;ascript:alert(1)">y</a>' +
    '<a href="https://example.com" target="_blank">ok</a><iframe src="https://evil"></iframe><svg onload=alert(1)></svg>';
  const clean = sanitizeHtml(dirty);
  assert.ok(!/script|onerror|onload|javascript|iframe|svg|url\(/i.test(clean), clean);
  assert.ok(clean.includes('<p style="text-align: center">Hi <strong>there</strong></p>'));
  assert.ok(clean.includes('<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">ok</a>'));
});

const p = (id: string, prediction_type: string, odds: number | null, confidence: number | null, fixture: number | null): SelectablePrediction => ({
  id,
  prediction_type,
  odds,
  confidence,
  kickoff_time: `2026-11-19T1${id}:00:00Z`,
  external_fixture_id: fixture,
  home_team: "A",
  away_team: "B",
});

test("market page selections", () => {
  const rows = [p("1", "Over 0.5 Goals", 1.05, 95, 1), p("2", "BTTS Yes", 1.7, 59, 1), p("3", "Home Win", 1.45, 69, 2), p("4", "Over 2.5 Goals", 1.9, 53, 2)];
  assert.deepEqual(applyMarketSelection(rows, getMarketPage("btts")!.selection).map((r) => r.id), ["2"]);
  assert.deepEqual(applyMarketSelection(rows, getMarketPage("safe-picks")!.selection).map((r) => r.id), ["3"], "over 0.5 excluded, <= 1.50 only");
  assert.deepEqual(applyMarketSelection(rows, getMarketPage("super-single")!.selection).map((r) => r.id), ["3"]);
  assert.deepEqual(applyMarketSelection(rows, getMarketPage("free")!.selection).map((r) => r.id), ["3", "2"], "one per fixture, skip ultra-short");
});

test("every market page has unique title, description, H1 and primary keyword", () => {
  for (const key of ["title", "description", "h1", "primaryKeyword", "intro"] as const) {
    const values = MARKET_PAGES.map((page) => page[key]);
    assert.equal(new Set(values).size, values.length, `duplicate ${key}`);
  }
  for (const page of MARKET_PAGES) {
    assert.ok(page.description.length <= 160, `${page.slug} description too long (${page.description.length})`);
    assert.ok(page.faqs.length >= 3, `${page.slug} needs FAQs`);
    for (const rel of page.related) assert.ok(getMarketPage(rel), `${page.slug} links to unknown ${rel}`);
  }
});

test("thin custom pages are not indexable", () => {
  const base = { slug: "acca-tips", is_published: true, noindex: false, canonical_url: null, description: null, heading: "Acca tips", meta_title: "Acca Tips Today", meta_description: "x".repeat(80) };
  assert.ok(indexabilityIssues({ ...base, introduction: "short", main_content: "" }).length > 0);
  assert.deepEqual(indexabilityIssues({ ...base, introduction: "i".repeat(200), main_content: "m".repeat(500) }), []);
  assert.ok(indexabilityIssues({ ...base, slug: "btts", introduction: "i".repeat(200), main_content: "m".repeat(500) }).length > 0, "reserved slug");
});
