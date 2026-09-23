import { upsertCatalogCard } from "@/lib/store";
import { SETS, type SetDef } from "@/lib/sets";

type TcgdexCard = {
  id: string;
  localId: string;
  name: string;
  image?: string;
};

type TcgdexSet = {
  id: string;
  name: string;
  cards?: TcgdexCard[];
};

export type SyncReport = {
  added: number;
  skipped: { code: string; reason: string }[];
};

export async function syncCatalog(): Promise<SyncReport> {
  let added = 0;
  const skipped: SyncReport["skipped"] = [];

  for (const set of SETS) {
    if (!set.tcgdexId) {
      skipped.push({
        code: set.code,
        reason: "Chưa có trên TCGdex. Thêm từng lá bằng form thủ công.",
      });
      continue;
    }
    const url = `https://api.tcgdex.net/v2/${set.language}/sets/${encodeURIComponent(set.tcgdexId)}`;
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      if (response.status === 404) {
        skipped.push({ code: set.code, reason: "TCGdex chưa có set này." });
        continue;
      }
      if (!response.ok) {
        skipped.push({ code: set.code, reason: `TCGdex lỗi ${response.status}.` });
        continue;
      }
      const body = (await response.json()) as TcgdexSet;
      const setName = set.tcgdexId === "30th-c" ? set.name : body.name || set.name;
      for (const card of body.cards ?? []) {
        if (!card.name) continue;
        const number = card.localId || card.id.split("-").pop() || "";
        const imageUrl = card.image || fallbackImage(set, number);
        if (!imageUrl) continue;
        upsertCatalogCard({
          id: card.id,
          language: set.language,
          setId: set.tcgdexId,
          setName,
          setCode: set.code,
          seasonKey: set.seasonKey,
          number,
          name: card.name,
          imageUrl,
        });
        added += 1;
      }
    } catch {
      skipped.push({ code: set.code, reason: "Không tải được set." });
    }
  }

  try {
    added += await syncM6a();
    const m6aSkip = skipped.findIndex((item) => item.code === "M6A");
    if (m6aSkip >= 0) skipped.splice(m6aSkip, 1);
  } catch {
    // M6A stays in the skipped list for manual entry.
  }

  return { added, skipped };
}

function fallbackImage(set: SetDef, number: string): string {
  const numeric = Number.parseInt(number, 10);
  if (set.language === "ja" && set.cardrushCode && Number.isFinite(numeric)) {
    const code = set.cardrushCode;
    return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpc/${code}/${code}_${numeric}_R_JP_LG.png`;
  }
  if (set.tcgdexId) {
    return `https://assets.tcgdex.net/${set.language}/me/${set.tcgdexId}/${number}`;
  }
  return "";
}

async function syncM6a(): Promise<number> {
  const response = await fetch("https://limitlesstcg.com/cards/jp/M6a", {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("limitless");
  const html = await response.text();
  const numbers = [...html.matchAll(/\/cards\/jp\/M6a\/(\d+)/g)]
    .map((match) => Number(match[1]))
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((a, b) => a - b);
  if (numbers.length === 0) throw new Error("empty");

  let added = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < numbers.length) {
      const number = numbers[cursor];
      cursor += 1;
      const name = await limitlessCardName(number);
      upsertCatalogCard({
        id: `M6a-${String(number).padStart(3, "0")}`,
        language: "ja",
        setId: "M6A",
        setName: "30th CELEBRATION",
        setCode: "M6A",
        seasonKey: "M6A",
        number: String(number).padStart(3, "0"),
        name,
        imageUrl: `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpc/M6a/M6a_${number}_R_JP_LG.png`,
      });
      added += 1;
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, numbers.length) }, () => worker()));
  return added;
}

async function limitlessCardName(number: number): Promise<string> {
  try {
    const response = await fetch(`https://limitlesstcg.com/cards/jp/M6a/${number}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return `M6A #${number}`;
    const html = await response.text();
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
    const name = title.split(" - ")[0]?.trim();
    return name || `M6A #${number}`;
  } catch {
    return `M6A #${number}`;
  }
}
