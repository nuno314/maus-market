"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

export type CartLine = { listingId: number; quantity: number };

type CartApi = {
  lines: CartLine[];
  count: number;
  add: (listingId: number, maxQty: number) => void;
  setQty: (listingId: number, quantity: number, maxQty: number) => void;
  remove: (listingId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);
const STORAGE_KEY = "maus-cart";
const CART_EVENT = "maus-cart-change";

function parseLines(raw: string): CartLine[] {
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line) => Number.isInteger(line.listingId) && Number.isInteger(line.quantity) && line.quantity > 0,
    );
  } catch {
    return [];
  }
}

function readRaw() {
  return localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function writeLines(lines: CartLine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(CART_EVENT));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CART_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CART_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  const lines = useMemo(() => parseLines(raw), [raw]);

  const api = useMemo<CartApi>(() => {
    const current = () => parseLines(readRaw());
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      add: (listingId, maxQty) => {
        const prev = current();
        const found = prev.find((line) => line.listingId === listingId);
        if (!found) {
          if (maxQty > 0) writeLines([...prev, { listingId, quantity: 1 }]);
          return;
        }
        if (found.quantity >= maxQty) return;
        writeLines(prev.map((line) => (line.listingId === listingId ? { ...line, quantity: line.quantity + 1 } : line)));
      },
      setQty: (listingId, quantity, maxQty) => {
        const prev = current();
        if (quantity <= 0) {
          writeLines(prev.filter((line) => line.listingId !== listingId));
          return;
        }
        writeLines(
          prev.map((line) =>
            line.listingId === listingId ? { ...line, quantity: Math.min(quantity, maxQty) } : line,
          ),
        );
      },
      remove: (listingId) => writeLines(current().filter((line) => line.listingId !== listingId)),
      clear: () => writeLines([]),
    };
  }, [lines]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart cần nằm trong CartProvider");
  return cart;
}
