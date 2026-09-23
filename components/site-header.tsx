"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";

export function SiteHeader() {
  const cart = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-[#d5e3f0] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image src="/logo.png" alt="Maus Collect" width={112} height={112} priority className="size-14 shrink-0 rounded-full bg-white" />
          <span className="min-w-0">
            <span className="block truncate text-lg font-extrabold leading-none tracking-tight text-[#1c2b3a]">
              Maus Collect
            </span>
            <span className="mt-1 block text-xs text-[#5d7388]">Pokémon · Mega Evolution</span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link
            href="/cart"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#24344a] px-3 text-sm font-semibold text-white"
          >
            <ShoppingBag className="size-4" />
            Giỏ
            <span className="grid min-w-5 place-items-center rounded-full bg-white px-1 text-xs text-[#24344a]">
              {cart.count}
            </span>
          </Link>
          <Link href="/admin" className="px-2 text-sm font-semibold text-[#3e5870] hover:text-[#1c2b3a]">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#d5e3f0] px-4 py-6 text-center text-sm text-[#5d7388]">
      Đặt hàng qua Zalo. Maus Collect không thu tiền trên web.
    </footer>
  );
}
