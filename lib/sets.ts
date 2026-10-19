export type Language = "en" | "ja";
export type Condition = "A" | "A-" | "B";
export type Category = "card" | "booster-box" | "box-seal" | "box-unseal" | "pack";
export type Era = "sv" | "me";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "card", label: "Thẻ" },
  { id: "booster-box", label: "Booster box" },
  { id: "box-seal", label: "Box seal" },
  { id: "box-unseal", label: "Box unseal" },
  { id: "pack", label: "Pack lẻ" },
];

export type SetDef = {
  tcgdexId: string | null;
  ptcgId: string | null;
  language: Language;
  era: Era;
  /** Code shown in the shop, e.g. M2A. */
  code: string;
  /** Code Cardrush prints on the card, e.g. M2a. */
  cardrushCode: string | null;
  seasonKey: string;
  name: string;
  /** Short label on filter chips. */
  chip: string;
};

const SCARLET_EN: { tcgdexId: string; ptcgId: string; code: string; name: string }[] = [
  { tcgdexId: "sv01", ptcgId: "sv1", code: "SV01", name: "Scarlet & Violet" },
  { tcgdexId: "sv02", ptcgId: "sv2", code: "SV02", name: "Paldea Evolved" },
  { tcgdexId: "sv03", ptcgId: "sv3", code: "SV03", name: "Obsidian Flames" },
  { tcgdexId: "sv03.5", ptcgId: "sv3pt5", code: "SV3.5", name: "151" },
  { tcgdexId: "sv04", ptcgId: "sv4", code: "SV04", name: "Paradox Rift" },
  { tcgdexId: "sv04.5", ptcgId: "sv4pt5", code: "SV4.5", name: "Paldean Fates" },
  { tcgdexId: "sv05", ptcgId: "sv5", code: "SV05", name: "Temporal Forces" },
  { tcgdexId: "sv06", ptcgId: "sv6", code: "SV06", name: "Twilight Masquerade" },
  { tcgdexId: "sv06.5", ptcgId: "sv6pt5", code: "SV6.5", name: "Shrouded Fable" },
  { tcgdexId: "sv07", ptcgId: "sv7", code: "SV07", name: "Stellar Crown" },
  { tcgdexId: "sv08", ptcgId: "sv8", code: "SV08", name: "Surging Sparks" },
  { tcgdexId: "sv08.5", ptcgId: "sv8pt5", code: "SV8.5", name: "Prismatic Evolutions" },
  { tcgdexId: "sv09", ptcgId: "sv9", code: "SV09", name: "Journey Together" },
  { tcgdexId: "sv10", ptcgId: "sv10", code: "SV10", name: "Destined Rivals" },
  { tcgdexId: "sv10.5w", ptcgId: "rsv10pt5", code: "SV10.5W", name: "White Flare" },
  { tcgdexId: "sv10.5b", ptcgId: "zsv10pt5", code: "SV10.5B", name: "Black Bolt" },
];

const SCARLET_JA: { tcgdexId: string; name: string }[] = [
  { tcgdexId: "SV1S", name: "スカーレットex" },
  { tcgdexId: "SV1V", name: "バイオレットex" },
  { tcgdexId: "SV1a", name: "トリプレットビート" },
  { tcgdexId: "SV2D", name: "クレイバースト" },
  { tcgdexId: "SV2P", name: "スノーハザード" },
  { tcgdexId: "SV2a", name: "ポケモンカード151" },
  { tcgdexId: "SV3", name: "黒炎の支配者" },
  { tcgdexId: "SV3a", name: "レイジングサーフ" },
  { tcgdexId: "SV4K", name: "古代の咆哮" },
  { tcgdexId: "SV4M", name: "未来の一閃" },
  { tcgdexId: "SV4a", name: "シャイニートレジャーex" },
  { tcgdexId: "SV5K", name: "ワイルドフォース" },
  { tcgdexId: "SV5M", name: "サイバージャッジ" },
  { tcgdexId: "SV5a", name: "クリムゾンヘイズ" },
  { tcgdexId: "SV6", name: "変幻の仮面" },
  { tcgdexId: "SV6a", name: "ナイトワンダラー" },
  { tcgdexId: "SV7", name: "ステラミラクル" },
  { tcgdexId: "SV7a", name: "楽園ドラゴーナ" },
  { tcgdexId: "SV8", name: "超電ブレイカー" },
  { tcgdexId: "SV8a", name: "テラスタルフェスex" },
  { tcgdexId: "SV9", name: "バトルパートナーズ" },
  { tcgdexId: "SV9a", name: "熱風のアリーナ" },
  { tcgdexId: "SV10", name: "ロケット団の栄光" },
  { tcgdexId: "SV11B", name: "ブラックボルト" },
  { tcgdexId: "SV11W", name: "ホワイトフレア" },
];

export const SETS: SetDef[] = [
  ...SCARLET_EN.map(
    (set): SetDef => ({
      tcgdexId: set.tcgdexId,
      ptcgId: set.ptcgId,
      language: "en",
      era: "sv",
      code: set.code,
      cardrushCode: null,
      seasonKey: set.tcgdexId,
      name: set.name,
      chip: set.name,
    }),
  ),
  ...SCARLET_JA.map(
    (set): SetDef => ({
      tcgdexId: set.tcgdexId,
      ptcgId: null,
      language: "ja",
      era: "sv",
      code: set.tcgdexId,
      cardrushCode: set.tcgdexId,
      seasonKey: set.tcgdexId,
      name: set.name,
      chip: set.tcgdexId,
    }),
  ),
  {
    tcgdexId: "me01",
    ptcgId: "me1",
    language: "en",
    era: "me",
    code: "ME01",
    cardrushCode: null,
    seasonKey: "me01",
    name: "Mega Evolution",
    chip: "Mega Evolution",
  },
  {
    tcgdexId: "me02",
    ptcgId: "me2",
    language: "en",
    era: "me",
    code: "ME02",
    cardrushCode: null,
    seasonKey: "me02",
    name: "Phantasmal Flames",
    chip: "Phantasmal Flames",
  },
  {
    tcgdexId: "me02.5",
    ptcgId: "me2pt5",
    language: "en",
    era: "me",
    code: "ME2.5",
    cardrushCode: null,
    seasonKey: "me02.5",
    name: "Ascended Heroes",
    chip: "Ascended Heroes",
  },
  {
    tcgdexId: "me03",
    ptcgId: "me3",
    language: "en",
    era: "me",
    code: "ME03",
    cardrushCode: null,
    seasonKey: "me03",
    name: "Perfect Order",
    chip: "Perfect Order",
  },
  {
    tcgdexId: "me04",
    ptcgId: "me4",
    language: "en",
    era: "me",
    code: "ME04",
    cardrushCode: null,
    seasonKey: "me04",
    name: "Chaos Rising",
    chip: "Chaos Rising",
  },
  {
    tcgdexId: "me05",
    ptcgId: "me5",
    language: "en",
    era: "me",
    code: "ME05",
    cardrushCode: null,
    seasonKey: "me05",
    name: "Pitch Black",
    chip: "Pitch Black",
  },
  {
    tcgdexId: "30th",
    ptcgId: "me55",
    language: "en",
    era: "me",
    code: "30th",
    cardrushCode: null,
    seasonKey: "30th",
    name: "30th Celebration",
    chip: "30th Celebration",
  },
  {
    tcgdexId: "30th-c",
    ptcgId: "me55c",
    language: "en",
    era: "me",
    code: "30th",
    cardrushCode: null,
    seasonKey: "30th",
    name: "30th Classic Collection",
    chip: "30th Celebration",
  },
  {
    tcgdexId: "M1L",
    ptcgId: null,
    language: "ja",
    era: "me",
    code: "M1L",
    cardrushCode: "M1L",
    seasonKey: "M1L",
    name: "メガブレイブ",
    chip: "M1L",
  },
  {
    tcgdexId: "M1S",
    ptcgId: null,
    language: "ja",
    era: "me",
    code: "M1S",
    cardrushCode: "M1S",
    seasonKey: "M1S",
    name: "メガシンフォニア",
    chip: "M1S",
  },
  {
    tcgdexId: "M2",
    ptcgId: null,
    language: "ja",
    era: "me",
    code: "M2",
    cardrushCode: "M2",
    seasonKey: "M2",
    name: "インフェルノX",
    chip: "M2",
  },
  {
    tcgdexId: "M2a",
    ptcgId: null,
    language: "ja",
    era: "me",
    code: "M2A",
    cardrushCode: "M2a",
    seasonKey: "M2A",
    name: "MEGAドリームex",
    chip: "M2A",
  },
  {
    tcgdexId: "M3",
    ptcgId: null,
    language: "ja",
    era: "me",
    code: "M3",
    cardrushCode: "M3",
    seasonKey: "M3",
    name: "ムニキスゼロ",
    chip: "M3",
  },
  {
    tcgdexId: "M4",
    ptcgId: null,
    language: "ja",
    era: "me",
    code: "M4",
    cardrushCode: "M4",
    seasonKey: "M4",
    name: "ニンジャスピナー",
    chip: "M4",
  },
  {
    tcgdexId: "M5",
    ptcgId: null,
    language: "ja",
    era: "me",
    code: "M5",
    cardrushCode: "M5",
    seasonKey: "M5",
    name: "アビスアイ",
    chip: "M5",
  },
  {
    tcgdexId: "M6",
    ptcgId: null,
    language: "ja",
    era: "me",
    code: "M6",
    cardrushCode: "M6",
    seasonKey: "M6",
    name: "ストームエメラルダ",
    chip: "M6",
  },
  {
    tcgdexId: null,
    ptcgId: null,
    language: "ja",
    era: "me",
    code: "M6A",
    cardrushCode: "M6a",
    seasonKey: "M6A",
    name: "30th CELEBRATION",
    chip: "M6A",
  },
];

export const ERAS: { id: Era; label: string }[] = [
  { id: "sv", label: "Scarlet & Violet" },
  { id: "me", label: "Mega Evolution" },
];

export const SEASONS = SETS.filter(
  (set, index, all) => all.findIndex((item) => item.seasonKey === set.seasonKey) === index,
).map((set) => ({
  key: set.seasonKey,
  language: set.language,
  era: set.era,
  name: set.name,
  code: set.code,
  label: `${set.name} · ${set.code}`,
}));

export const CONDITIONS: Condition[] = ["A", "A-", "B"];

export function findSet(setId: string): SetDef | undefined {
  return SETS.find((set) => set.tcgdexId === setId || set.seasonKey === setId || set.code === setId);
}

export function seasonRank(seasonKey: string): number {
  const index = SEASONS.findIndex((season) => season.key === seasonKey);
  return index === -1 ? 99 : index;
}

export function conditionRank(condition: string): number {
  if (condition === "A") return 0;
  if (condition === "A-") return 1;
  if (condition === "B") return 2;
  return 9;
}

export function languageLabel(language: Language): string {
  return language === "en" ? "Tiếng Anh" : "Tiếng Nhật";
}

export function categoryLabel(category: string): string {
  return CATEGORIES.find((item) => item.id === category)?.label ?? "Thẻ";
}

export function asCategory(value: string | null | undefined): Category {
  return CATEGORIES.some((item) => item.id === value) ? (value as Category) : "card";
}

export function setCaption(card: { setCode: string; setName: string }): string {
  return `${card.setName} · ${card.setCode}`;
}

export function listingCaption(item: {
  setCode: string;
  setName: string;
  number: string;
  category: Category;
}): string {
  const season = setCaption(item);
  if (item.category === "card" && item.number.trim()) return `${season} · #${item.number}`;
  return season;
}

export function cardrushSearchUrl(code: string, number: string): string {
  const keyword = `${code} ${number.padStart(3, "0")}`;
  return `https://www.cardrush-pokemon.jp/product-list?keyword=${encodeURIComponent(keyword)}`;
}
