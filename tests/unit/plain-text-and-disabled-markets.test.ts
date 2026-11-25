import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInline, parsePlainText, plainTextOf, safeLinkHref } from "@/lib/content/plain-text";
import { ACTIVE_MARKET_KEYS, ENABLED_MARKETS_FILTER, isMarketEnabled, withoutDisabledMarkets } from "@/lib/predictions/markets";
import { MARKET_GROUP_ORDER, MARKET_PAGES, getMarketPage } from "@/lib/seo/market-pages";
import { customPageContentLength } from "@/lib/seo/custom-page-rules";

test("documented formats: paragraphs, ## headings, - bullets", () => {
  const blocks = parsePlainText("First line\nsame paragraph\n\n## Heading\n\n- one\n- two\n\nLast");
  assert.deepEqual(blocks, [
    { type: "p", text: "First line same paragraph" },
    { type: "h2", text: "Heading" },
    { type: "ul", items: ["one", "two"] },
    { type: "p", text: "Last" },
  ]);
});

test("a heading does not swallow the text under it", () => {
  assert.deepEqual(parsePlainText("## How accas work\nEach leg must win."), [
    { type: "h2", text: "How accas work" },
    { type: "p", text: "Each leg must win." },
  ]);
});

test("a lead-in line followed by bullets becomes a paragraph and a list", () => {
  assert.deepEqual(parsePlainText("Things to check:\n- team news\n- form\nThat's it."), [
    { type: "p", text: "Things to check:" },
    { type: "ul", items: ["team news", "form"] },
    { type: "p", text: "That's it." },
  ]);
});

test("pasted formats: ###, numbered lists, • and * bullets, Windows newlines, nbsp", () => {
  const blocks = parsePlainText("### Small heading\r\n1. first\r\n2) second\r\n\r\n• dot\r\n* star\r\n \r\nend");
  assert.deepEqual(blocks, [
    { type: "h3", text: "Small heading" },
    { type: "ol", items: ["first", "second"] },
    { type: "ul", items: ["dot", "star"] },
    { type: "p", text: "end" },
  ]);
  assert.equal(parsePlainText("# Not an extra h1")[0].type, "h2");
});

test("text that only looks like markup stays text", () => {
  assert.deepEqual(parsePlainText("#1 pick of the day\n-5 goal swing\n2-1 is a common score"), [
    { type: "p", text: "#1 pick of the day -5 goal swing 2-1 is a common score" },
  ]);
  assert.deepEqual(parsePlainText("<script>alert(1)</script>"), [{ type: "p", text: "<script>alert(1)</script>" }]);
  assert.deepEqual(parsePlainText("  \n\n \n"), []);
});

test("inline bold and safe links only", () => {
  assert.deepEqual(parseInline("See **today's** [BTTS tips](/tips/btts) or [docs](https://example.com/x)."), [
    { type: "text", text: "See " },
    { type: "bold", text: "today's" },
    { type: "text", text: " " },
    { type: "link", text: "BTTS tips", href: "/tips/btts", external: false },
    { type: "text", text: " or " },
    { type: "link", text: "docs", href: "https://example.com/x", external: true },
    { type: "text", text: "." },
  ]);
  assert.deepEqual(parseInline("[x](javascript:alert(1))"), [{ type: "text", text: "x" }, { type: "text", text: ")" }]);
  assert.equal(safeLinkHref("//evil.com"), null);
  assert.equal(safeLinkHref("data:text/html,hi"), null);
  assert.deepEqual(parseInline("2 * 3 and **unclosed"), [{ type: "text", text: "2 * 3 and **unclosed" }]);
});

test("content length ignores formatting markers", () => {
  assert.equal(plainTextOf("## Title\n\n- **a** [b](/x)"), "Title a b");
  assert.equal(customPageContentLength({ introduction: "## Hi", main_content: "[link text](/tips/btts)", description: null }), "Hi link text".length);
});

test("correct score is switched off everywhere public", () => {
  assert.equal(isMarketEnabled("correct_score"), false);
  assert.equal(isMarketEnabled("btts"), true);
  assert.equal(isMarketEnabled(null), true, "bespoke picks (no market) stay visible");
  assert.ok(!ACTIVE_MARKET_KEYS.includes("correct_score"));
  assert.equal(getMarketPage("correct-score"), undefined);
  assert.ok(MARKET_PAGES.every((p) => p.slug !== "correct-score" && MARKET_GROUP_ORDER.includes(p.group)));
  assert.ok(MARKET_GROUP_ORDER.every((g) => MARKET_PAGES.some((p) => p.group === g)), "no empty market groups");
  assert.ok(MARKET_PAGES.every((p) => p.related.every((slug) => getMarketPage(slug))), "related links all resolve");
  assert.equal(ENABLED_MARKETS_FILTER, "market.is.null,market.not.in.(correct_score)");
  const rows = [
    { prediction_type: "2-1", market: "correct_score" },
    { prediction_type: "1:0", market: null },
    { prediction_type: "Over 2.5 Goals", market: "over_2_5" },
    { prediction_type: "Over 4.5", market: null },
  ];
  assert.deepEqual(withoutDisabledMarkets(rows).map((r) => r.prediction_type), ["Over 2.5 Goals", "Over 4.5"]);
});
