import type { Condition } from "@/lib/sets";

export type Currency = "USD" | "JPY";

export type PriceSettings = {
  usdVnd: number;
  jpyVnd: number;
  markupPercent: number;
  factorA: number;
  factorAMinus: number;
  factorB: number;
};

export function conditionFactor(condition: Condition, settings: PriceSettings): number {
  if (condition === "A") return settings.factorA;
  if (condition === "A-") return settings.factorAMinus;
  return settings.factorB;
}

export function computeVnd(input: {
  sourcePrice: number;
  currency: Currency;
  condition: Condition;
  conditionPriced: boolean;
  settings: PriceSettings;
}): number {
  const fx = input.currency === "USD" ? input.settings.usdVnd : input.settings.jpyVnd;
  const factor = input.conditionPriced ? 1 : conditionFactor(input.condition, input.settings);
  const raw = input.sourcePrice * fx * factor * (1 + input.settings.markupPercent / 100);
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.round(raw);
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSource(amount: number, currency: Currency): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
