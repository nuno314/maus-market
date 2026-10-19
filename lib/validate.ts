import type { Category, Condition, Language } from "@/lib/sets";
import { CATEGORIES, CONDITIONS } from "@/lib/sets";

export function parseCondition(value: FormDataEntryValue | null): Condition | null {
  const text = String(value ?? "");
  return CONDITIONS.includes(text as Condition) ? (text as Condition) : null;
}

export function parseCategory(value: FormDataEntryValue | null): Category | null {
  const text = String(value ?? "");
  return CATEGORIES.some((item) => item.id === text) ? (text as Category) : null;
}

export function parseLanguage(value: FormDataEntryValue | null): Language | null {
  const text = String(value ?? "");
  if (text === "en" || text === "ja") return text;
  return null;
}

export function parseQuantity(value: FormDataEntryValue | null): number | null {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) return null;
  return quantity;
}

export function parseVnd(value: FormDataEntryValue | null): number | null {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const amount = Number(digits);
  if (!Number.isInteger(amount) || amount < 1000 || amount > 100_000_000) return null;
  return amount;
}

export function parseMoney(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim().replace(",", ".");
  if (!text) return null;
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) return null;
  return amount;
}

export function parseHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function cleanPhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 12;
}

export function isValidName(value: string): boolean {
  const name = value.trim();
  return name.length >= 2 && name.length <= 80;
}
