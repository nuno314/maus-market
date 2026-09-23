import { CardrushBlockedError, cardrushKeyword, fetchCardrushListings, pickCardrushPrice } from "@/lib/cardrush";
import { computeVnd } from "@/lib/money";
import { cardrushSearchUrl, findSet, type Condition } from "@/lib/sets";
import type { CardRow } from "@/lib/store";
import { getSettings } from "@/lib/store";
import { fetchTcgplayerQuote, variantLabel } from "@/lib/tcgplayer";

export type PriceQuote =
  | {
      ok: true;
      sourcePrice: number;
      sourceCurrency: "USD" | "JPY";
      sourceUrl: string | null;
      sourceLabel: string;
      conditionPriced: boolean;
      priceVnd: number;
      note: string;
    }
  | {
      ok: false;
      message: string;
      sourceUrl: string | null;
      sourceCurrency: "USD" | "JPY";
    };

export async function quoteCard(card: CardRow, condition: Condition): Promise<PriceQuote> {
  const set = findSet(card.setId) ?? findSet(card.seasonKey) ?? findSet(card.setCode);
  const settings = getSettings();
  if (card.language === "en") {
    return quoteEnglish(card, condition, set?.ptcgId ?? null, settings);
  }
  return quoteJapanese(card, condition, set?.cardrushCode ?? card.setCode, settings);
}

async function quoteEnglish(
  card: CardRow,
  condition: Condition,
  ptcgId: string | null,
  settings: ReturnType<typeof getSettings>,
): Promise<PriceQuote> {
  if (!ptcgId) {
    return {
      ok: false,
      message: "Set này chưa có giá TCGPlayer. Nhập giá USD của condition đang bán.",
      sourceUrl: null,
      sourceCurrency: "USD",
    };
  }
  try {
    const quote = await fetchTcgplayerQuote(ptcgId, card.number);
    if (!quote) {
      return {
        ok: false,
        message: "TCGPlayer chưa có giá market cho lá này. Nhập giá USD thủ công.",
        sourceUrl: null,
        sourceCurrency: "USD",
      };
    }
    const conditionPriced = condition === "A";
    const priceVnd = computeVnd({
      sourcePrice: quote.market,
      currency: "USD",
      condition,
      conditionPriced,
      settings,
    });
    const factorNote = conditionPriced
      ? "Giá Near Mint trên TCGPlayer."
      : `TCGPlayer là giá Near Mint. Condition ${condition} đang nhân hệ số trong Cài đặt.`;
    return {
      ok: true,
      sourcePrice: quote.market,
      sourceCurrency: "USD",
      sourceUrl: quote.url,
      sourceLabel: `TCGPlayer market · ${variantLabel(quote.variant)}`,
      conditionPriced,
      priceVnd,
      note: factorNote,
    };
  } catch {
    return {
      ok: false,
      message: "Không gọi được Pokémon TCG API. Nhập giá USD trên TCGPlayer.",
      sourceUrl: null,
      sourceCurrency: "USD",
    };
  }
}

async function quoteJapanese(
  card: CardRow,
  condition: Condition,
  cardrushCode: string,
  settings: ReturnType<typeof getSettings>,
): Promise<PriceQuote> {
  const searchUrl = cardrushSearchUrl(cardrushCode, card.number);
  try {
    const hits = await fetchCardrushListings(cardrushKeyword(cardrushCode, card.number));
    const picked = pickCardrushPrice(hits, cardrushCode, card.number, condition);
    if (!picked) {
      return {
        ok: false,
        message: "Không thấy lá này trên Cardrush. Mở link và nhập giá yên.",
        sourceUrl: searchUrl,
        sourceCurrency: "JPY",
      };
    }
    const priceVnd = computeVnd({
      sourcePrice: picked.priceJpy,
      currency: "JPY",
      condition,
      conditionPriced: picked.matched,
      settings,
    });
    return {
      ok: true,
      sourcePrice: picked.priceJpy,
      sourceCurrency: "JPY",
      sourceUrl: picked.url ?? searchUrl,
      sourceLabel: picked.matched ? `Cardrush · condition ${condition}` : "Cardrush · hàng mới",
      conditionPriced: picked.matched,
      priceVnd,
      note: picked.matched
        ? "Lấy đúng dòng condition trên Cardrush, không nhân thêm hệ số."
        : `Cardrush không có dòng ${condition}. Giá hàng mới được nhân hệ số trong Cài đặt.`,
    };
  } catch (error) {
    const blocked = error instanceof CardrushBlockedError;
    return {
      ok: false,
      message: blocked
        ? "Cardrush đang chặn truy cập tự động. Mở link, xem giá yên của condition, rồi nhập vào ô giá."
        : "Không đọc được Cardrush. Nhập giá yên thủ công.",
      sourceUrl: searchUrl,
      sourceCurrency: "JPY",
    };
  }
}

export async function priceFromManualSource(input: {
  sourcePrice: number;
  currency: "USD" | "JPY";
  condition: Condition;
  conditionPriced: boolean;
}) {
  const settings = getSettings();
  return computeVnd({
    sourcePrice: input.sourcePrice,
    currency: input.currency,
    condition: input.condition,
    conditionPriced: input.conditionPriced,
    settings,
  });
}
