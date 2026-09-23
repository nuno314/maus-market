import assert from "node:assert/strict";
import { parseCardrushHtml, pickCardrushPrice } from "../lib/cardrush";
import { computeVnd } from "../lib/money";
import { pickTcgMarket } from "../lib/tcgplayer";

const html = `
<ul>
  <li><a href="/product/1"><img src="https://img.example/a.jpg">メガフシギバナex【RR】{003/063} [M1L] 220円(税込)</a></li>
  <li><a href="/product/2">〔状態A-〕メガフシギバナex【RR】{003/063} [M1L] 170円</a></li>
  <li><a href="/product/3">〔状態B〕メガフシギバナex【RR】{003/063} [M1L] 90円</a></li>
  <li><a href="/product/4">〔状態C〕メガフシギバナex【RR】{003/063} [M1L] 40円</a></li>
  <li><a href="/product/9">別カード【RR】{010/063} [M1L] 999円</a></li>
</ul>`;

const hits = parseCardrushHtml(html);
assert.equal(hits.length, 5);
const fresh = pickCardrushPrice(hits, "M1L", "003", "A");
const minus = pickCardrushPrice(hits, "M1L", "3", "A-");
const played = pickCardrushPrice(hits, "M1L", "003", "B");
assert.equal(fresh?.priceJpy, 220);
assert.equal(fresh?.matched, true);
assert.equal(minus?.priceJpy, 170);
assert.equal(minus?.matched, true);
assert.equal(played?.priceJpy, 90);
assert.equal(played?.matched, true);

const estimated = pickCardrushPrice(
  hits.filter((hit) => hit.condition === null),
  "M1L",
  "003",
  "B",
);
assert.equal(estimated?.matched, false);
assert.equal(estimated?.priceJpy, 220);

const settings = {
  usdVnd: 25000,
  jpyVnd: 160,
  markupPercent: 0,
  factorA: 1,
  factorAMinus: 0.9,
  factorB: 0.75,
};
assert.equal(
  computeVnd({ sourcePrice: 1, currency: "USD", condition: "A", conditionPriced: true, settings }),
  25000,
);
assert.equal(
  computeVnd({ sourcePrice: 220, currency: "JPY", condition: "B", conditionPriced: false, settings }),
  Math.round(220 * 160 * 0.75),
);
assert.equal(
  computeVnd({ sourcePrice: 170, currency: "JPY", condition: "A-", conditionPriced: true, settings }),
  Math.round(170 * 160),
);

assert.deepEqual(pickTcgMarket({ normal: { market: 0.26 }, reverseHolofoil: { market: 0.4 } }), {
  variant: "normal",
  market: 0.26,
});
assert.deepEqual(pickTcgMarket({ holofoil: { market: 12 } }), { variant: "holofoil", market: 12 });

assert.throws(() => parseCardrushHtml("<title>Just a moment...</title>"));

console.log("pricing checks ok");
