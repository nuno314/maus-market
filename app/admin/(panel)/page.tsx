import Link from "next/link";
import {
  deleteListingAction,
  refreshAllPricesAction,
  refreshListingAction,
  syncCatalogAction,
  updateQuantityAction,
} from "@/app/actions/admin";
import { CreateListingForm, ManualListingForm } from "@/components/admin-forms";
import { CardThumb } from "@/components/card-thumb";
import { ConditionBadge } from "@/components/condition-badge";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { formatSource, formatVnd } from "@/lib/money";
import { quoteCard } from "@/lib/pricing";
import { CONDITIONS, languageLabel, setCaption, type Condition } from "@/lib/sets";
import { countCards, getCard, listAllListings, searchCards } from "@/lib/store";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const q = one(query.q);
  const cardId = one(query.card);
  const conditionRaw = one(query.condition);
  const condition: Condition = CONDITIONS.includes(conditionRaw as Condition) ? (conditionRaw as Condition) : "A";
  const catalogCount = countCards();
  const results = q ? searchCards(q) : [];
  const selected = cardId ? getCard(cardId) : null;
  const quote = selected ? await quoteCard(selected, condition) : null;
  const stock = listAllListings();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">Kho thẻ</h1>
        <p className="text-sm text-[#5d7388]">
          Catalog đang có {catalogCount} lá. Đăng những lá bạn đang cầm, kèm condition và giá thị trường.
        </p>
      </div>

      <Notice query={query} />

      <section className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold">Đồng bộ catalog Mega Evolution</h2>
            <p className="text-sm text-[#5d7388]">Tải tên, số và ảnh từ TCGdex. M6A thêm tay nếu chưa có.</p>
          </div>
          <form action={syncCatalogAction}>
            <SubmitButton className="h-11 rounded-full" pendingLabel="Đang tải set…">
              Đồng bộ catalog
            </SubmitButton>
          </form>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
        <h2 className="font-extrabold">Đăng lá từ catalog</h2>
        <form action="/admin" className="mt-3 flex gap-2">
          <Input name="q" defaultValue={q} placeholder="Tên hoặc số lá" className="h-11 rounded-full" aria-label="Tìm trong catalog" />
          <button type="submit" className="h-11 shrink-0 rounded-full bg-[#24344a] px-4 text-sm font-semibold text-white">
            Tìm
          </button>
        </form>
        {q && results.length === 0 ? <p className="mt-3 text-sm text-[#5d7388]">Không có lá khớp. Thử đồng bộ catalog hoặc thêm tay.</p> : null}
        {results.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {results.map((card) => (
              <li key={card.id}>
                <Link
                  href={`/admin?q=${encodeURIComponent(q)}&card=${encodeURIComponent(card.id)}&condition=${condition}`}
                  className={`flex items-center gap-3 rounded-2xl p-2 ring-1 ${
                    card.id === selected?.id ? "bg-[#f3f8fc] ring-[#8eb8d6]" : "ring-[#e1ebf3]"
                  }`}
                >
                  <CardThumb src={card.imageUrl} alt="" className="h-16 w-12 rounded-md" />
                  <span>
                    <span className="block font-bold">{card.name}</span>
                    <span className="block text-xs text-[#5d7388]">
                      {setCaption(card)} · #{card.number} · {languageLabel(card.language)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {selected && quote ? <CreateListingForm card={selected} condition={condition} query={q} quote={quote} /> : null}
      </section>

      <ManualListingForm />

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">Đang đăng ({stock.length})</h2>
          {stock.length > 0 ? (
            <form action={refreshAllPricesAction}>
              <SubmitButton variant="outline" className="h-10 rounded-full" pendingLabel="Đang cập nhật…">
                Cập nhật tất cả giá
              </SubmitButton>
            </form>
          ) : null}
        </div>
        {stock.length === 0 ? (
          <p className="rounded-3xl bg-white px-5 py-8 text-center text-sm text-[#5d7388] ring-1 ring-[#d5e3f0]">
            Chưa có listing. Tìm lá ở trên rồi đăng lên shop.
          </p>
        ) : (
          <ul className="grid gap-3">
            {stock.map((listing) => (
              <li key={listing.id} className="flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-[#d5e3f0] sm:flex-row">
                <CardThumb src={listing.imageUrl} alt={listing.name} className="h-28 w-20 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{listing.name}</p>
                  <p className="text-sm text-[#5d7388]">
                    {setCaption(listing)} · #{listing.number}
                  </p>
                  <div className="mt-1">
                    <ConditionBadge condition={listing.condition} />
                  </div>
                  <p className="mt-2 text-sm">
                    {listing.sourcePrice !== null ? formatSource(listing.sourcePrice, listing.sourceCurrency) : "—"} ·{" "}
                    <span className="font-extrabold">{formatVnd(listing.priceVnd)}</span>
                  </p>
                  <p className="text-xs text-[#5d7388]">{listing.sourceLabel}</p>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <form action={updateQuantityAction} className="flex items-end gap-2">
                      <input type="hidden" name="id" value={listing.id} />
                      <label className="grid gap-1 text-xs font-semibold text-[#5d7388]">
                        Số lượng
                        <Input name="quantity" type="number" min={0} max={99} defaultValue={listing.quantity} className="h-10 w-20 rounded-xl" />
                      </label>
                      <SubmitButton variant="secondary" className="h-10 rounded-full" pendingLabel="…">
                        Lưu
                      </SubmitButton>
                    </form>
                    <form action={refreshListingAction}>
                      <input type="hidden" name="id" value={listing.id} />
                      <SubmitButton variant="outline" className="h-10 rounded-full" pendingLabel="…">
                        Cập nhật giá
                      </SubmitButton>
                    </form>
                    <form action={deleteListingAction}>
                      <input type="hidden" name="id" value={listing.id} />
                      <SubmitButton variant="ghost" className="h-10 rounded-full text-[#8a3b3b]" pendingLabel="…">
                        Gỡ
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Notice({ query }: { query: Record<string, string | string[] | undefined> }) {
  const synced = one(query.synced);
  const skip = one(query.skip);
  const listed = one(query.listed);
  const priced = one(query.priced);
  const priceFailed = one(query.priceFailed);
  const priceError = one(query.priceError);
  if (!synced && !listed && !priced && !priceError) return null;
  return (
    <div className="rounded-2xl bg-[#eef7f1] px-4 py-3 text-sm text-[#24573a]">
      {synced ? <p>Đã lưu {synced} lá từ catalog.{skip ? ` Chưa đồng bộ: ${skip}.` : ""}</p> : null}
      {listed ? <p>Đã đăng lá lên shop.</p> : null}
      {priced ? (
        <p>
          Đã cập nhật giá{priceFailed ? `, ${priceFailed} lá giữ giá cũ vì không lấy được nguồn` : ""}.
        </p>
      ) : null}
      {priceError ? <p className="text-[#8a3b3b]">{priceError}</p> : null}
    </div>
  );
}
