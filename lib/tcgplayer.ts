export type TcgPrices = Record<string, { market?: number | null } | undefined>;

const VARIANT_ORDER = [
  "normal",
  "holofoil",
  "reverseHolofoil",
  "1stEditionHolofoil",
  "unlimitedHolofoil",
];

const VARIANT_LABEL: Record<string, string> = {
  normal: "thường",
  holofoil: "holo",
  reverseHolofoil: "reverse holo",
  "1stEditionHolofoil": "1st holo",
  unlimitedHolofoil: "unlimited holo",
};

export function variantLabel(variant: string): string {
  return VARIANT_LABEL[variant] ?? variant;
}

export function pickTcgMarket(
  prices: TcgPrices | undefined,
): { variant: string; market: number } | null {
  if (!prices) return null;
  for (const key of VARIANT_ORDER) {
    const market = prices[key]?.market;
    if (typeof market === "number" && market > 0) return { variant: key, market };
  }
  for (const [key, value] of Object.entries(prices)) {
    const market = value?.market;
    if (typeof market === "number" && market > 0) return { variant: key, market };
  }
  return null;
}

type TcgCard = {
  id: string;
  name: string;
  number: string;
  tcgplayer?: {
    url?: string;
    updatedAt?: string;
    prices?: TcgPrices;
  };
};

export async function fetchTcgplayerQuote(
  ptcgSetId: string,
  number: string,
): Promise<{ market: number; variant: string; url: string | null; updatedAt: string | null } | null> {
  const numeric = String(Number.parseInt(number, 10));
  const query = `set.id:${ptcgSetId} number:${numeric}`;
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=5&select=id,name,number,tcgplayer`;
  let response: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (response.ok) break;
    if (response.status < 500 && response.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
  }
  if (!response || !response.ok) {
    throw new Error(`Pokémon TCG API ${response?.status ?? "network"}`);
  }
  const body = (await response.json()) as { data?: TcgCard[] };
  const card =
    body.data?.find((item) => String(Number.parseInt(item.number, 10)) === numeric) ??
    body.data?.[0];
  if (!card) return null;
  const picked = pickTcgMarket(card.tcgplayer?.prices);
  if (!picked) return null;
  return {
    market: picked.market,
    variant: picked.variant,
    url: card.tcgplayer?.url ?? null,
    updatedAt: card.tcgplayer?.updatedAt ?? null,
  };
}
