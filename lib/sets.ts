export type Language = "en" | "ja";
export type Condition = "A" | "A-" | "B";

export type SetDef = {
  tcgdexId: string | null;
  ptcgId: string | null;
  language: Language;
  /** Code shown in the shop, e.g. M2A. */
  code: string;
  /** Code Cardrush prints on the card, e.g. M2a. */
  cardrushCode: string | null;
  seasonKey: string;
  name: string;
  /** Short label on filter chips. */
  chip: string;
};

export const SETS: SetDef[] = [
  {
    tcgdexId: "me01",
    ptcgId: "me1",
    language: "en",
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
    code: "M6A",
    cardrushCode: "M6a",
    seasonKey: "M6A",
    name: "30th CELEBRATION",
    chip: "M6A",
  },
];

export const SEASONS = SETS.filter(
  (set, index, all) => all.findIndex((item) => item.seasonKey === set.seasonKey) === index,
).map((set) => ({
  key: set.seasonKey,
  language: set.language,
  label: set.chip,
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

export function setCaption(card: {
  language: Language;
  setCode: string;
  setName: string;
}): string {
  if (card.language === "ja") return `${card.setCode} · ${card.setName}`;
  return card.setName;
}

export function cardrushSearchUrl(code: string, number: string): string {
  const keyword = `${code} ${number.padStart(3, "0")}`;
  return `https://www.cardrush-pokemon.jp/product-list?keyword=${encodeURIComponent(keyword)}`;
}
