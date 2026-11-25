import { test } from "node:test";
import assert from "node:assert/strict";
import { pageMetadata } from "@/lib/seo";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { addDaysToKey, isOtherDayView, lagosDateKey } from "@/lib/utils/date";

test("page titles never carry the brand twice", () => {
  for (const title of ["Over 2.5 Explained | SureMatchContact", "Over 2.5 Explained – SureMatchContact", "Over 2.5 Explained"]) {
    const meta = pageMetadata({ title, description: "d", path: "/x" });
    assert.equal(meta.title, "Over 2.5 Explained", title);
    assert.equal((meta.openGraph as { title?: string }).title, "Over 2.5 Explained");
  }
});

test("images without a safe src are dropped; missing alt becomes decorative", () => {
  assert.equal(sanitizeHtml('<p>a</p><img src="x" onerror="alert(1)"><img src="javascript:alert(1)">'), "<p>a</p>");
  assert.match(sanitizeHtml('<img src="https://media.api-sports.io/x.png">'), /^<img src="https:\/\/media\.api-sports\.io\/x\.png" alt="" loading="lazy" decoding="async">$/);
  assert.match(sanitizeHtml('<img src="/a.png" alt="Chart">'), /alt="Chart"/);
});

test("other-day views are detected for noindex", () => {
  const today = lagosDateKey();
  assert.equal(isOtherDayView(undefined, undefined), false);
  assert.equal(isOtherDayView("today", undefined), false);
  assert.equal(isOtherDayView(undefined, today), false);
  assert.equal(isOtherDayView("tomorrow", undefined), true);
  assert.equal(isOtherDayView("previous", undefined), true);
  assert.equal(isOtherDayView(undefined, addDaysToKey(today, -3)), true);
  assert.equal(isOtherDayView(undefined, "not-a-date"), false);
});
