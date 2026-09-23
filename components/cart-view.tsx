"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CardThumb } from "@/components/card-thumb";
import { useCart } from "@/components/cart-provider";
import { ConditionBadge } from "@/components/condition-badge";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/lib/money";
import { setCaption } from "@/lib/sets";
import type { ShopListing } from "@/lib/store";

export function CartView() {
  const cart = useCart();
  const { rows, loading, error } = useListingRows(cart.lines.map((line) => line.listingId));

  if (loading) {
    return <Panel title="Đang mở giỏ…" body="Một chút thôi." />;
  }
  if (error) {
    return <Panel title="Không tải được giỏ" body={error} />;
  }
  if (cart.lines.length === 0) {
    return (
      <Panel title="Giỏ đang trống" body="Chọn lá ở trang chủ, rồi quay lại đây để thanh toán.">
        <Link href="/" className="mt-4 inline-flex h-10 items-center rounded-full bg-[#24344a] px-4 text-sm font-semibold text-white">
          Xem thẻ đang có
        </Link>
      </Panel>
    );
  }

  const lines = cart.lines.map((line) => ({
    line,
    listing: rows.find((row) => row.id === line.listingId) ?? null,
  }));
  const total = lines.reduce((sum, item) => {
    if (!item.listing || item.listing.quantity < 1) return sum;
    return sum + item.listing.priceVnd * Math.min(item.line.quantity, item.listing.quantity);
  }, 0);

  return (
    <div className="grid gap-4">
      <ul className="grid gap-3">
        {lines.map(({ line, listing }) => (
          <li key={line.listingId} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-[#d5e3f0]">
            {listing ? (
              <CardThumb src={listing.imageUrl} alt={listing.name} className="h-28 w-20 shrink-0 rounded-lg" />
            ) : (
              <div className="grid h-28 w-20 shrink-0 place-items-center rounded-lg bg-[#e7f1f8] text-xs text-[#5d7388]">
                Hết
              </div>
            )}
            <div className="min-w-0 flex-1">
              {listing && listing.quantity > 0 ? (
                <>
                  <p className="font-bold">{listing.name}</p>
                  <p className="text-sm text-[#5d7388]">
                    {setCaption(listing)} · #{listing.number}
                  </p>
                  <div className="mt-1">
                    <ConditionBadge condition={listing.condition} />
                  </div>
                  <p className="mt-2 font-extrabold">{formatVnd(listing.priceVnd)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => cart.setQty(listing.id, line.quantity - 1, listing.quantity)}
                    >
                      −
                    </Button>
                    <span className="w-6 text-center text-sm font-bold">{Math.min(line.quantity, listing.quantity)}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => cart.setQty(listing.id, line.quantity + 1, listing.quantity)}
                    >
                      +
                    </Button>
                    <button type="button" className="ml-auto text-sm font-semibold text-[#8a3b3b]" onClick={() => cart.remove(listing.id)}>
                      Xóa
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-bold">Lá này không còn bán</p>
                  <button type="button" className="mt-2 text-sm font-semibold text-[#8a3b3b]" onClick={() => cart.remove(line.listingId)}>
                    Xóa khỏi giỏ
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl bg-white p-4 ring-1 ring-[#d5e3f0]">
        <div className="flex items-center justify-between text-lg font-extrabold">
          <span>Tổng</span>
          <span>{formatVnd(total)}</span>
        </div>
        <p className="mt-1 text-sm text-[#5d7388]">Thanh toán bằng cách gửi đơn. Admin sẽ nhắn Zalo để chốt.</p>
        <Link
          href="/checkout"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#24344a] text-sm font-semibold text-white"
        >
          Thanh toán
        </Link>
      </div>
    </div>
  );
}

export function useListingRows(ids: number[]) {
  const key = ids.join(",");
  const [state, setState] = useState<{ key: string; rows: ShopListing[]; error: string }>({
    key: "",
    rows: [],
    error: "",
  });

  useEffect(() => {
    if (!key) return;
    let cancel = false;
    fetch(`/api/listings?ids=${key}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("bad");
        return (await response.json()) as ShopListing[];
      })
      .then((data) => {
        if (!cancel) setState({ key, rows: data, error: "" });
      })
      .catch(() => {
        if (!cancel) setState({ key, rows: [], error: "Thử tải lại trang." });
      });
    return () => {
      cancel = true;
    };
  }, [key]);

  if (!key) return { rows: [], loading: false, error: "" };
  return {
    rows: state.key === key ? state.rows : [],
    loading: state.key !== key,
    error: state.key === key ? state.error : "",
  };
}

function Panel({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white px-5 py-10 text-center ring-1 ring-[#d5e3f0]">
      <p className="text-lg font-extrabold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#5d7388]">{body}</p>
      {children}
    </div>
  );
}
