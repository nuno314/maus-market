"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { placeOrderAction } from "@/app/actions/checkout";
import { useListingRows } from "@/components/cart-view";
import { CardThumb } from "@/components/card-thumb";
import { useCart } from "@/components/cart-provider";
import { ProductMeta } from "@/components/product-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatVnd } from "@/lib/money";

export function CheckoutForm() {
  const cart = useCart();
  const router = useRouter();
  const { rows, loading, error } = useListingRows(cart.lines.map((line) => line.listingId));
  const [shipping, setShipping] = useState<"manual" | "later">("later");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  if (loading) {
    return <p className="text-sm text-[#5d7388]">Đang chuẩn bị đơn…</p>;
  }
  if (error) {
    return <p className="text-sm text-[#8a3b3b]">{error}</p>;
  }

  const lines = cart.lines
    .map((line) => {
      const listing = rows.find((row) => row.id === line.listingId);
      if (!listing || listing.quantity < 1) return null;
      const quantity = Math.min(line.quantity, listing.quantity);
      return { listing, quantity };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl bg-white px-5 py-10 text-center ring-1 ring-[#d5e3f0]">
        <p className="text-lg font-extrabold">Chưa có lá để thanh toán</p>
        <Link href="/" className="mt-4 inline-flex h-10 items-center rounded-full bg-[#24344a] px-4 text-sm font-semibold text-white">
          Về shop
        </Link>
      </div>
    );
  }

  const total = lines.reduce((sum, line) => sum + line.listing.priceVnd * line.quantity, 0);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    const formData = new FormData(event.currentTarget);
    formData.set(
      "lines",
      JSON.stringify(lines.map((line) => ({ listingId: line.listing.id, quantity: line.quantity }))),
    );
    const result = await placeOrderAction(formData);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    cart.clear();
    router.push(`/order/${result.code}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
        <h2 className="text-lg font-extrabold">Thông tin Zalo</h2>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="zaloName">Tên Zalo</Label>
            <Input id="zaloName" name="zaloName" required minLength={2} maxLength={80} className="h-11 rounded-xl" placeholder="Tên hiển thị trên Zalo" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="zaloPhone">Số điện thoại Zalo</Label>
            <Input id="zaloPhone" name="zaloPhone" required inputMode="tel" className="h-11 rounded-xl" placeholder="09xxxxxxxx" />
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">Phương thức giao hàng</legend>
            <label className={`rounded-2xl p-3 ring-1 ${shipping === "manual" ? "bg-[#f3f8fc] ring-[#8eb8d6]" : "ring-[#d5e3f0]"}`}>
              <span className="flex items-center gap-2 font-semibold">
                <input type="radio" name="shippingMethod" value="manual" checked={shipping === "manual"} onChange={() => setShipping("manual")} />
                Nhập tay
              </span>
              <span className="mt-1 block pl-6 text-sm text-[#5d7388]">Ghi địa chỉ ngay trong đơn.</span>
            </label>
            <label className={`rounded-2xl p-3 ring-1 ${shipping === "later" ? "bg-[#f3f8fc] ring-[#8eb8d6]" : "ring-[#d5e3f0]"}`}>
              <span className="flex items-center gap-2 font-semibold">
                <input type="radio" name="shippingMethod" value="later" checked={shipping === "later"} onChange={() => setShipping("later")} />
                Thảo luận sau
              </span>
              <span className="mt-1 block pl-6 text-sm text-[#5d7388]">Admin nhắn Zalo để chốt cách nhận hàng.</span>
            </label>
          </fieldset>
          {shipping === "manual" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="shippingAddress">Địa chỉ</Label>
              <Textarea id="shippingAddress" name="shippingAddress" required minLength={5} rows={3} className="rounded-xl" placeholder="Số nhà, đường, quận, thành phố" />
            </div>
          ) : null}
        </div>
        {formError ? <p className="mt-3 text-sm font-semibold text-[#8a3b3b]">{formError}</p> : null}
        <Button type="submit" className="mt-4 h-11 w-full rounded-full" disabled={submitting}>
          {submitting ? "Đang gửi đơn…" : "Gửi đơn thanh toán"}
        </Button>
      </section>
      <aside className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
        <h2 className="text-lg font-extrabold">Đơn của bạn</h2>
        <ul className="mt-3 grid gap-3">
          {lines.map((line) => (
            <li key={line.listing.id} className="flex gap-3">
              <CardThumb src={line.listing.imageUrl} alt={line.listing.name} className="h-20 w-14 rounded-md" />
              <div className="min-w-0">
                <p className="font-bold leading-snug">{line.listing.name}</p>
                {line.listing.description ? <p className="line-clamp-2 text-xs text-[#5d7388]">{line.listing.description}</p> : null}
                <ProductMeta item={line.listing} captionClassName="text-xs text-[#5d7388]" />
                <p className="mt-1 text-xs">× {line.quantity}</p>
                <p className="mt-1 text-sm font-bold">{formatVnd(line.listing.priceVnd * line.quantity)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-[#d5e3f0] pt-3 text-lg font-extrabold">
          <span>Tổng</span>
          <span>{formatVnd(total)}</span>
        </div>
      </aside>
    </form>
  );
}
