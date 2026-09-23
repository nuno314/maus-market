import type { Condition } from "@/lib/sets";

export type CardrushCondition = Condition | "other" | null;

export type CardrushHit = {
  title: string;
  condition: CardrushCondition;
  priceJpy: number;
  url?: string;
  imageUrl?: string;
};

export class CardrushBlockedError extends Error {
  url: string;

  constructor(url: string) {
    super("Cardrush đang chặn truy cập tự động.");
    this.name = "CardrushBlockedError";
    this.url = url;
  }
}

export function readCondition(text: string): CardrushCondition {
  if (/状態\s*A\s*[-－−]/.test(text)) return "A-";
  if (/状態\s*B/.test(text)) return "B";
  if (/状態\s*A(?![-－−])/.test(text)) return "A";
  if (/状態|PSA|鑑定/.test(text)) return "other";
  return null;
}

function looksLikeProduct(text: string): boolean {
  return /\d+\s*\/\s*\d+|状態|\[M\d/i.test(text);
}

export function parseCardrushHtml(html: string): CardrushHit[] {
  const blocked =
    /Just a moment|cf-browser-verification|challenge-platform|Attention Required/i.test(html) &&
    !/円/.test(html);
  if (blocked) {
    throw new CardrushBlockedError("https://www.cardrush-pokemon.jp/");
  }

  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const marked = withoutScripts.replace(
    /<a\b[^>]*href="([^"]*product[^"]*)"/gi,
    "\n@@A $1\n",
  );
  const parts = marked.split("\n@@A ");
  const hits: CardrushHit[] = [];

  for (const part of parts) {
    const yen = part.match(/([\d,]+)\s*円/);
    if (!yen) continue;
    const text = part.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!looksLikeProduct(text)) continue;
    const priceJpy = Number(yen[1].replace(/,/g, ""));
    if (!Number.isFinite(priceJpy) || priceJpy <= 0) continue;
    const urlToken = part.match(/^(\S+)/)?.[1];
    let url: string | undefined;
    if (urlToken && (urlToken.includes("product") || urlToken.startsWith("/"))) {
      url = new URL(urlToken.replace(/["']$/g, ""), "https://www.cardrush-pokemon.jp").toString();
    }
    const imageUrl = part.match(/<img[^>]+src="([^"]+)"/i)?.[1];
    hits.push({
      title: text.slice(0, 220),
      condition: readCondition(text),
      priceJpy,
      url,
      imageUrl,
    });
  }

  if (hits.length > 0) return hits;

  const text = withoutScripts.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  for (const match of text.matchAll(/(.{0,180}?)([\d,]+)\s*円/g)) {
    const window = match[1] ?? "";
    if (!/\d+\s*\/\s*\d+|状態/.test(window)) continue;
    const priceJpy = Number(match[2].replace(/,/g, ""));
    if (!Number.isFinite(priceJpy) || priceJpy <= 0) continue;
    hits.push({
      title: window.trim().slice(-180),
      condition: readCondition(window),
      priceJpy,
    });
  }
  return hits;
}

function cheapest(hits: CardrushHit[]): CardrushHit {
  return hits.reduce((best, hit) => (hit.priceJpy < best.priceJpy ? hit : best));
}

function mentionsNumber(title: string, number: number): boolean {
  return [...title.matchAll(/(\d+)\s*\/\s*(\d+)/g)].some((match) => Number(match[1]) === number);
}

export function pickCardrushPrice(
  hits: CardrushHit[],
  setCode: string,
  number: string,
  condition: Condition,
): { priceJpy: number; matched: boolean; url?: string; title: string } | null {
  const numeric = Number.parseInt(number, 10);
  const code = setCode.toLowerCase();
  const relevant = hits.filter((hit) => {
    const title = hit.title.toLowerCase();
    const codeOk = title.includes(`[${code}]`) || title.includes(code);
    return codeOk && mentionsNumber(hit.title, numeric);
  });
  const pool = relevant.length
    ? relevant
    : hits.filter((hit) => mentionsNumber(hit.title, numeric));
  if (pool.length === 0) return null;

  const exact = pool.filter((hit) => hit.condition === condition);
  if (exact.length > 0) {
    const best = cheapest(exact);
    return { priceJpy: best.priceJpy, matched: true, url: best.url, title: best.title };
  }

  if (condition === "A") {
    const labeledA = pool.filter((hit) => hit.condition === "A");
    if (labeledA.length > 0) {
      const best = cheapest(labeledA);
      return { priceJpy: best.priceJpy, matched: true, url: best.url, title: best.title };
    }
  }

  const fresh = pool.filter((hit) => hit.condition === null || hit.condition === "A");
  if (fresh.length === 0) return null;
  const best = cheapest(fresh);
  return {
    priceJpy: best.priceJpy,
    matched: condition === "A",
    url: best.url,
    title: best.title,
  };
}

export function cardrushKeyword(code: string, number: string): string {
  return `${code} ${number.padStart(3, "0")}`;
}

export async function fetchCardrushListings(keyword: string): Promise<CardrushHit[]> {
  const url = `https://www.cardrush-pokemon.jp/product-list?keyword=${encodeURIComponent(keyword)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ja,en;q=0.8",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  const html = await response.text();
  if (!response.ok && !html.includes("円")) {
    throw new CardrushBlockedError(url);
  }
  try {
    return parseCardrushHtml(html);
  } catch (error) {
    if (error instanceof CardrushBlockedError) {
      error.url = url;
    }
    throw error;
  }
}
