import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyMarketText,
  createSiteText,
  faqToText,
  fillVars,
  getContentField,
  getContentGroups,
  listItems,
  parseFaqText,
} from "@/lib/content/registry";
import { LONG_PAGE_DEFAULTS } from "@/lib/content/page-defaults";
import { parsePlainText } from "@/lib/content/plain-text";
import { MARKET_PAGES } from "@/lib/seo/market-pages";

test("every editable field has a unique key and a default", () => {
  const groups = getContentGroups();
  const keys = groups.flatMap((g) => g.fields.map((f) => f.key));
  assert.equal(new Set(keys).size, keys.length, "duplicate content keys");
  assert.equal(new Set(groups.map((g) => g.id)).size, groups.length, "duplicate group ids");
  for (const group of groups) {
    // Optional fields may start empty (e.g. pages that have no intro paragraph today).
    for (const field of group.fields) if (!field.optional) assert.ok(field.default.trim(), `${field.key} has an empty default`);
  }
  // One group per built-in market, one per long page.
  assert.equal(groups.filter((g) => g.section === "Markets").length, MARKET_PAGES.length);
  assert.equal(groups.filter((g) => g.section === "Long pages").length, Object.keys(LONG_PAGE_DEFAULTS).length);
});

test("with no edits, market pages render exactly as before", () => {
  const text = createSiteText(null);
  for (const page of MARKET_PAGES) {
    const out = applyMarketText(page, text);
    assert.equal(out.tabLabel, page.tabLabel);
    assert.equal(out.h1, page.h1);
    assert.equal(out.intro, page.intro);
    assert.equal(out.title, page.title);
    assert.equal(out.description, page.description);
    assert.equal(out.explainer.heading, page.explainer.heading);
    assert.deepEqual(out.howSelected, page.howSelected, `${page.slug} howSelected`);
    assert.deepEqual(out.factors, page.factors, `${page.slug} factors`);
    assert.equal(out.limitations, page.limitations);
    assert.deepEqual(out.faqs, page.faqs, `${page.slug} faqs`);
    // Explainer paragraphs come back as the same paragraphs.
    assert.deepEqual(
      parsePlainText(out.explainer.paragraphs.join("\n\n")).map((b) => ("text" in b ? b.text : "")),
      page.explainer.paragraphs
    );
  }
});

test("edits replace defaults; empty only hides optional fields", () => {
  const text = createSiteText({
    texts: {
      "nav.today": "Today's tips",
      "market.free.tab": "Free Picks",
      "home.intro": "",
      "home.h1": "   ",
      "footer.copyright": "© {year} Sure Match Tips Ltd",
    },
  });
  assert.equal(text.t("nav.today"), "Today's tips");
  assert.equal(text.t("nav.tomorrow"), "Tomorrow"); // untouched -> default
  assert.equal(text.t("market.free.tab"), "Free Picks");
  assert.equal(applyMarketText(MARKET_PAGES.find((p) => p.slug === "free")!, text).tabLabel, "Free Picks");
  assert.equal(text.t("home.intro"), ""); // optional: emptied = hidden
  assert.equal(text.t("home.h1"), getContentField("home.h1")!.default); // required: blank = default
  assert.equal(text.t("footer.copyright", { year: 2026 }), "© 2026 Sure Match Tips Ltd");
});

test("placeholders: known ones are filled, others and {{blocks}} are left alone", () => {
  assert.equal(fillVars("{market} picks for {date}", { market: "BTTS", date: "Today" }), "BTTS picks for Today");
  assert.equal(fillVars("Keep {unknown}", { market: "x" }), "Keep {unknown}");
  assert.equal(fillVars("{{odds-table}}", { "odds-table": "x" }), "{{odds-table}}");
  const methodology = createSiteText(null).t("page.methodology.body", { draw_min_odds: "2.40" });
  assert.match(methodology, /priced at 2\.40 or longer/);
  assert.match(methodology, /^\{\{odds-table\}\}$/m);
});

test("FAQ and list formats round-trip", () => {
  const items = [
    { question: "Are the tips free?", answer: "Yes. Every tip is free." },
    { question: "How are results checked?", answer: "Automatically.\n\nSee the [methodology](/methodology)." },
  ];
  assert.deepEqual(parseFaqText(faqToText(items)), items);
  assert.deepEqual(parseFaqText("## Unanswered\n\n## Q\nA"), [{ question: "Q", answer: "A" }]);
  assert.deepEqual(listItems("- one\n• two\n3. three\nfour\n\n"), ["one", "two", "three", "four"]);
  // The FAQ page default parses into its questions.
  const faqs = parseFaqText(LONG_PAGE_DEFAULTS.faq.body);
  assert.ok(faqs.length >= 6);
  assert.equal(faqs[0].question, "Are Sure Match Tips predictions free?");
});

test("long page 'Last updated' only moves forward", () => {
  const original = LONG_PAGE_DEFAULTS.about.updated;
  assert.equal(createSiteText(null).pageUpdated("about"), original);
  assert.equal(createSiteText({ pageUpdated: { about: "2099-01-01" } }).pageUpdated("about"), "2099-01-01");
  assert.equal(createSiteText({ pageUpdated: { about: "2000-01-01" } }).pageUpdated("about"), original);
});
