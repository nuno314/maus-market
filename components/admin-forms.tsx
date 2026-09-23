"use client";

import { useActionState } from "react";
import {
  createListingAction,
  createManualListingAction,
  loginAction,
  saveSettingsAction,
} from "@/app/actions/admin";
import { SubmitButton } from "@/components/submit-button";
import { CardThumb } from "@/components/card-thumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSource, formatVnd, type PriceSettings } from "@/lib/money";
import { CONDITIONS, SEASONS, setCaption, type Condition } from "@/lib/sets";
import type { CardRow } from "@/lib/store";
import type { PriceQuote } from "@/lib/pricing";

const field = "h-11 rounded-xl bg-white";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, null);
  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input id="username" name="username" autoComplete="username" required className={field} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className={field} />
      </div>
      {state?.error ? <p className="text-sm font-semibold text-[#8a3b3b]">{state.error}</p> : null}
      <SubmitButton className="h-11 rounded-full">Đăng nhập</SubmitButton>
    </form>
  );
}

export function CreateListingForm({
  card,
  condition,
  query,
  quote,
}: {
  card: CardRow;
  condition: Condition;
  query: string;
  quote: PriceQuote;
}) {
  const [state, action] = useActionState(createListingAction, null);
  const currency = card.language === "en" ? "USD" : "JPY";
  return (
    <form action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="cardId" value={card.id} />
      <input type="hidden" name="condition" value={condition} />
      <input type="hidden" name="sourceUrl" value={quote.ok ? quote.sourceUrl ?? "" : quote.sourceUrl ?? ""} />
      <input type="hidden" name="sourceLabel" value={quote.ok ? quote.sourceLabel : "Nhập tay"} />
      <div className="flex gap-3 rounded-2xl bg-[#f4f8fb] p-3">
        <CardThumb src={card.imageUrl} alt={card.name} className="h-24 w-16 rounded-lg" />
        <div>
          <p className="font-extrabold">{card.name}</p>
          <p className="text-sm text-[#5d7388]">
            {setCaption(card)} · #{card.number}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {CONDITIONS.map((item) => (
              <a
                key={item}
                href={`/admin?q=${encodeURIComponent(query)}&card=${encodeURIComponent(card.id)}&condition=${encodeURIComponent(item)}`}
                className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                  item === condition ? "bg-[#24344a] text-white ring-[#24344a]" : "bg-white ring-[#d5e3f0]"
                }`}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
      {quote.ok ? (
        <div className="rounded-2xl bg-[#f3f8fc] p-3 text-sm">
          <p className="font-semibold">{quote.sourceLabel}</p>
          <p>
            Nguồn {formatSource(quote.sourcePrice, quote.sourceCurrency)} → bán {formatVnd(quote.priceVnd)}
          </p>
          <p className="mt-1 text-[#5d7388]">{quote.note}</p>
          {quote.sourceUrl ? (
            <a href={quote.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-[#1a4f86]">
              Mở trang giá
            </a>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#fff6f4] p-3 text-sm text-[#8a3b3b]">
          <p>{quote.message}</p>
          {quote.sourceUrl ? (
            <a href={quote.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold underline">
              Mở Cardrush / nguồn giá
            </a>
          ) : null}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="quantity">Số lượng</Label>
          <Input id="quantity" name="quantity" type="number" min={1} max={99} defaultValue={1} required className={field} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="sourcePrice">Giá nguồn ({currency})</Label>
          <Input
            id="sourcePrice"
            name="sourcePrice"
            inputMode="decimal"
            defaultValue={quote.ok ? String(quote.sourcePrice) : ""}
            placeholder={currency === "USD" ? "0.00" : "220"}
            className={field}
          />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="conditionPriced"
          value="1"
          defaultChecked={quote.ok ? quote.conditionPriced : true}
          className="mt-1"
        />
        <span>Giá nguồn đã đúng condition này. Bỏ chọn nếu đây là giá hàng mới / Near Mint và cần nhân hệ số.</span>
      </label>
      {state?.error ? <p className="text-sm font-semibold text-[#8a3b3b]">{state.error}</p> : null}
      <SubmitButton className="h-11 rounded-full" pendingLabel="Đang đăng…">
        Đăng lên shop
      </SubmitButton>
    </form>
  );
}

export function ManualListingForm() {
  const [state, action] = useActionState(createManualListingAction, null);
  return (
    <details className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0]">
      <summary className="cursor-pointer font-extrabold">Thêm lá chưa có trong catalog</summary>
      <p className="mt-2 text-sm text-[#5d7388]">Dùng cho M6A hoặc lá TCGdex chưa có. Dán link ảnh và giá USD hoặc yên.</p>
      <form action={action} className="mt-3 grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="setId">Mùa</Label>
          <select id="setId" name="setId" className={`${field} w-full border px-3`} required>
            {SEASONS.map((season) => (
              <option key={season.key} value={season.key}>
                {season.language === "ja" ? `${season.label} · tiếng Nhật` : season.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Tên lá</Label>
            <Input id="name" name="name" required className={field} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="number">Số</Label>
            <Input id="number" name="number" required className={field} placeholder="003" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="imageUrl">Link ảnh</Label>
          <Input id="imageUrl" name="imageUrl" type="url" required className={field} placeholder="https://" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="manual-condition">Condition</Label>
            <select id="manual-condition" name="condition" className={`${field} w-full border px-3`} defaultValue="A">
              {CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="manual-qty">Số lượng</Label>
            <Input id="manual-qty" name="quantity" type="number" min={1} max={99} defaultValue={1} required className={field} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="manual-price">Giá nguồn</Label>
            <Input id="manual-price" name="sourcePrice" inputMode="decimal" required className={field} placeholder="USD hoặc JPY" />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="conditionPriced" value="1" defaultChecked className="mt-1" />
          <span>Giá này đã là giá của condition đang bán.</span>
        </label>
        {state?.error ? <p className="text-sm font-semibold text-[#8a3b3b]">{state.error}</p> : null}
        <SubmitButton className="h-11 rounded-full">Lưu lá thủ công</SubmitButton>
      </form>
    </details>
  );
}

export function SettingsForm({ settings }: { settings: PriceSettings }) {
  const [state, action] = useActionState(saveSettingsAction, null);
  return (
    <form action={action} className="grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField name="usdVnd" label="1 USD = bao nhiêu VND" defaultValue={settings.usdVnd} step="0.01" />
        <NumberField name="jpyVnd" label="1 JPY = bao nhiêu VND" defaultValue={settings.jpyVnd} step="0.0001" />
        <NumberField name="markupPercent" label="Phần trăm lời" defaultValue={settings.markupPercent} step="0.1" />
        <NumberField name="factorA" label="Hệ số condition A" defaultValue={settings.factorA} step="0.01" />
        <NumberField name="factorAMinus" label="Hệ số condition A-" defaultValue={settings.factorAMinus} step="0.01" />
        <NumberField name="factorB" label="Hệ số condition B" defaultValue={settings.factorB} step="0.01" />
      </div>
      {state?.error ? <p className="text-sm font-semibold text-[#8a3b3b]">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm font-semibold text-[#2f6f4e]">{state.ok}</p> : null}
      <SubmitButton className="h-11 rounded-full">Lưu cài đặt</SubmitButton>
    </form>
  );
}

function NumberField({
  name,
  label,
  defaultValue,
  step,
}: {
  name: string;
  label: string;
  defaultValue: number;
  step: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" step={step} defaultValue={defaultValue} required className={field} />
    </div>
  );
}
