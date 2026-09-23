"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { CardThumb } from "@/components/card-thumb";
import { useCart } from "@/components/cart-provider";
import { ConditionBadge } from "@/components/condition-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatVnd } from "@/lib/money";
import { SEASONS, languageLabel, setCaption, type Language } from "@/lib/sets";
import type { ShopListing } from "@/lib/store";

export function ShopBrowser({ listings }: { listings: ShopListing[] }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<"all" | Language>("all");
  const [season, setSeason] = useState("all");
  const seasons = SEASONS.filter((item) => language === "all" || item.language === language);

  const needle = query.trim().toLowerCase();
  const visible = listings.filter((item) => {
    if (language !== "all" && item.language !== language) return false;
    if (season !== "all" && item.seasonKey !== season) return false;
    if (!needle) return true;
    const hay = `${item.name} ${item.number} ${item.setName} ${item.setCode}`.toLowerCase();
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
            placeholder="Tìm tên lá, ví dụ Charizard hoặc ピカチュウ"
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

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <SeasonChip active={season === "all"} onClick={() => setSeason("all")}>
          Mọi mùa
        </SeasonChip>
        {seasons.map((item) => (
          <SeasonChip key={item.key} active={season === item.key} onClick={() => setSeason(item.key)}>
            {item.label}
          </SeasonChip>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#5d7388]">
        A gần như mới, A- xước nhẹ, B đã chơi rõ. Giá tiếng Anh theo TCGPlayer, tiếng Nhật theo Cardrush, hiển thị bằng VND.
      </p>

      {listings.length === 0 ? (
        <EmptyState
          title="Kho đang trống"
          body="Khi admin đăng thẻ Mega Evolution đang có, lá sẽ hiện ở đây kèm ảnh và giá."
        />
      ) : visible.length === 0 ? (
        <EmptyState title="Không thấy lá nào" body="Thử tên khác, hoặc bỏ lọc mùa." />
      ) : (
        <>
          <p className="mt-4 text-sm font-semibold text-[#3e5870]">{visible.length} thẻ đang có</p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((listing) => (
              <li key={listing.id} className="flex flex-col rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-[#d5e3f0]">
                <CardThumb
                  src={listing.imageUrl}
                  alt={listing.name}
                  className="aspect-[63/88] w-full rounded-xl"
                />
                <div className="mt-2 flex flex-1 flex-col gap-1">
                  <p className="line-clamp-2 text-sm font-bold leading-snug">{listing.name}</p>
                  <p className="text-xs text-[#5d7388]">
                    {setCaption(listing)} · #{listing.number}
                  </p>
                  <p className="text-xs text-[#5d7388]">{languageLabel(listing.language)}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <ConditionBadge condition={listing.condition} />
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

function SeasonChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${
        active ? "bg-[#d7ebf8] text-[#1a4f86] ring-[#b7d4ea]" : "bg-white text-[#3e5870] ring-[#d5e3f0]"
      }`}
    >
      {children}
    </button>
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
