"use client";

import { useActionState, useState } from "react";
import { updateListingAction } from "@/app/actions/admin";
import { ImageField } from "@/components/image-field";
import { SeasonNav } from "@/components/season-nav";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, CONDITIONS, SEASONS, hasSeason, type Category } from "@/lib/sets";
import type { ShopListing } from "@/lib/store";

const field = "h-11 rounded-xl bg-white";
const selectClass = `${field} w-full border border-[#d5e3f0] px-3`;

export function EditListingForm({ listing }: { listing: ShopListing }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(updateListingAction, null);
  const [category, setCategory] = useState<Category>(listing.category);
  const [setId, setSetId] = useState(listing.seasonKey || SEASONS[0]?.key || "");
  const [uploading, setUploading] = useState(false);
  const manual = listing.manual === 1;
  const activeCategory = manual ? category : listing.category;
  const isCard = activeCategory === "card";
  const seasonal = hasSeason(activeCategory);
  const canEditPrice = manual || listing.sourceCurrency === "VND";

  if (!open) {
    return (
      <button type="button" className="h-10 rounded-full px-4 text-sm font-semibold text-[#24344a] ring-1 ring-[#d5e3f0]" onClick={() => setOpen(true)}>
        Sửa
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 grid w-full gap-3 rounded-2xl bg-[#f7fbfe] p-3 ring-1 ring-[#d5e3f0]">
      <input type="hidden" name="id" value={listing.id} />
      <div className="flex items-center justify-between gap-2">
        <p className="font-extrabold">Sửa sản phẩm</p>
        <button type="button" className="text-sm font-semibold text-[#5d7388]" onClick={() => setOpen(false)}>
          Đóng
        </button>
      </div>
      {manual ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor={`category-${listing.id}`}>Loại</Label>
            <select
              id={`category-${listing.id}`}
              name="category"
              className={selectClass}
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
            >
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          {seasonal ? (
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Mùa</Label>
              <input type="hidden" name="setId" value={setId} />
              <SeasonNav seasons={SEASONS} value={setId} onChange={setSetId} />
            </div>
          ) : (
            <input type="hidden" name="setId" value="" />
          )}
        </div>
      ) : (
        <p className="text-sm text-[#5d7388]">Lá từ catalog giữ tên và mùa. Có thể sửa mô tả, ảnh, số lượng và condition.</p>
      )}
      <div className={`grid gap-3 ${isCard && manual ? "sm:grid-cols-2" : ""}`}>
        {manual ? (
          <div className="grid gap-1.5">
            <Label htmlFor={`name-${listing.id}`}>{isCard ? "Tên lá" : "Tên sản phẩm"}</Label>
            <Input id={`name-${listing.id}`} name="name" required defaultValue={listing.name} className={field} />
          </div>
        ) : null}
        {isCard && manual ? (
          <div className="grid gap-1.5">
            <Label htmlFor={`number-${listing.id}`}>Số</Label>
            <Input id={`number-${listing.id}`} name="number" required defaultValue={listing.number} className={field} />
          </div>
        ) : (
          <input type="hidden" name="number" value={isCard ? listing.number : ""} />
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`description-${listing.id}`}>Mô tả</Label>
        <Textarea id={`description-${listing.id}`} name="description" maxLength={400} rows={3} defaultValue={listing.description} className="rounded-xl bg-white" />
      </div>
      <ImageField key={listing.id} initial={listing.images.length ? listing.images : [listing.imageUrl]} onBusyChange={setUploading} />
      <div className={`grid gap-3 ${isCard ? "sm:grid-cols-3" : canEditPrice ? "sm:grid-cols-2" : ""}`}>
        {isCard ? (
          <div className="grid gap-1.5">
            <Label htmlFor={`condition-${listing.id}`}>Condition</Label>
            <select id={`condition-${listing.id}`} name="condition" className={selectClass} defaultValue={listing.condition}>
              {CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="condition" value="A" />
        )}
        <div className="grid gap-1.5">
          <Label htmlFor={`qty-${listing.id}`}>Số lượng</Label>
          <Input id={`qty-${listing.id}`} name="quantity" type="number" min={0} max={99} defaultValue={listing.quantity} required className={field} />
        </div>
        {canEditPrice ? (
          <div className="grid gap-1.5">
            <Label htmlFor={`price-${listing.id}`}>Giá bán (VND)</Label>
            <Input id={`price-${listing.id}`} name="priceVnd" inputMode="numeric" required defaultValue={listing.priceVnd} className={field} />
          </div>
        ) : null}
      </div>
      {state?.error ? <p className="text-sm font-semibold text-[#8a3b3b]">{state.error}</p> : null}
      <SubmitButton className="h-11 rounded-full" disabled={uploading} pendingLabel="Đang lưu…">
        Lưu thay đổi
      </SubmitButton>
    </form>
  );
}
