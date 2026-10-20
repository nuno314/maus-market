"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { CardThumb } from "@/components/card-thumb";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatVnd } from "@/lib/money";
import { ProductMeta } from "@/components/product-meta";
import { SeasonNav } from "@/components/season-nav";
import { CATEGORIES, SEASONS, hasSeason, languageLabel, type Category, type Language } from "@/lib/sets";
import type { ShopListing } from "@/lib/store";

export function ShopBrowser({ listings }: { listings: ShopListing[] }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<"all" | Language>("all");
  const [season, setSeason] = useState("all");
  const [category, setCategory] = useState<"all" | Category>("all");
  const seasons = SEASONS.filter((item) => language === "all" || item.language === language);

  const needle = query.trim().toLowerCase();
  const visible = listings.filter((item) => {
    if (language !== "all" && hasSeason(item.category) && item.language !== language) return false;
    if (season !== "all" && item.seasonKey !== season) return false;
    if (category !== "all" && item.category !== category) return false;
    if (!needle) return true;
    const hay = `${item.name} ${item.number} ${item.setName} ${item.setCode} ${item.description}`.toLowerCase();
    return hay.includes(needle);
  });

  function chooseLanguage(next: "all" | Language) {
    setLanguage(next);
    if (season === "all") return;
    const selected = SEASONS.find((item) => item.key === season);
    if (next !== "all" && selected && selected.language !== next) setSeason("all");
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#7b90a3]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên, ví dụ Charizard hoặc booster box"
            className="h-11 rounded-full pl-9"
            aria-label="Tìm tên lá bài"
          />
        </div>
        <div className="flex rounded-full bg-white p-1 ring-1 ring-[#d5e3f0]">
          {(
            [
              ["all", "Tất cả"],
              ["en", "Tiếng Anh"],
              ["ja", "Tiếng Nhật"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseLanguage(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                language === value ? "bg-[#24344a] text-white" : "text-[#3e5870]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <SeasonNav seasons={seasons} value={season} onChange={setSeason} allowAll />
      </div>
      <label className="mt-3 grid max-w-xs gap-1 text-xs font-semibold text-[#5d7388]">
        Loại
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as "all" | Category)}
          className="h-11 rounded-full border border-[#d5e3f0] bg-white px-3 text-sm font-semibold text-[#1c2b3a]"
          aria-label="Lọc theo loại sản phẩm"
        >
          <option value="all">Mọi loại</option>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-xs text-[#5d7388]">
        Thẻ dùng condition A gần như mới, A- xước nhẹ, B đã chơi rõ. Hộp và pack không dùng condition. Giá hiển thị bằng VND.
      </p>

      {listings.length === 0 ? (
        <EmptyState
          title="Kho đang trống"
          body="Khi admin đăng thẻ, hộp hoặc pack đang có, sản phẩm sẽ hiện ở đây kèm ảnh và giá."
        />
      ) : visible.length === 0 ? (
        <EmptyState title="Không thấy sản phẩm nào" body="Thử tên khác, hoặc bỏ lọc mùa và loại." />
      ) : (
        <>
          <p className="mt-4 text-sm font-semibold text-[#3e5870]">{visible.length} sản phẩm đang có</p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((listing) => (
              <li key={listing.id} className="flex flex-col rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-[#d5e3f0]">
                <CardThumb
                  src={listing.imageUrl}
                  alt={listing.name}
                  className={listing.category === "card" ? "aspect-[63/88] w-full rounded-xl" : "aspect-square w-full rounded-xl"}
                />
                <div className="mt-2 flex flex-1 flex-col gap-1">
                  <p className="line-clamp-2 text-sm font-bold leading-snug">{listing.name}</p>
                  {listing.description ? <p className="line-clamp-2 text-xs text-[#5d7388]">{listing.description}</p> : null}
                  <ProductMeta item={listing} captionClassName="text-xs text-[#5d7388]" />
                  {hasSeason(listing.category) ? <p className="text-xs text-[#5d7388]">{languageLabel(listing.language)}</p> : null}
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <span className="text-xs text-[#5d7388]">Còn {listing.quantity}</span>
                  </div>
                  <p className="mt-1 text-base font-extrabold text-[#1c2b3a]">{formatVnd(listing.priceVnd)}</p>
                  <AddButton listing={listing} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6 rounded-3xl bg-white px-5 py-10 text-center ring-1 ring-[#d5e3f0]">
      <p className="text-lg font-extrabold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#5d7388]">{body}</p>
    </div>
  );
}

function AddButton({ listing }: { listing: ShopListing }) {
  const cart = useCart();
  const inCart = cart.lines.find((line) => line.listingId === listing.id)?.quantity ?? 0;
  const remaining = listing.quantity - inCart;
  return (
    <Button
      type="button"
      className="mt-2 h-10 w-full rounded-full"
      disabled={remaining <= 0}
      onClick={() => cart.add(listing.id, listing.quantity)}
    >
      {remaining <= 0 ? "Đã đủ trong giỏ" : inCart > 0 ? `Thêm nữa · ${inCart}` : "Thêm vào giỏ"}
    </Button>
  );
}
