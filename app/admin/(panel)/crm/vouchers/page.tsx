import { deleteVoucherAction, toggleVoucherAction } from "@/app/actions/crm";
import { VoucherForm } from "@/components/voucher-form";
import { formatVnd, formatWhen } from "@/lib/money";
import { listVouchers } from "@/lib/vouchers";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function offer(kind: "percent" | "amount", value: number) {
  return kind === "percent" ? `Giảm ${value}%` : `Giảm ${formatVnd(value)}`;
}

export default async function VouchersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const error = one(query.error);
  const created = one(query.created) === "1";
  const vouchers = await listVouchers();

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">Voucher</h1>
        <p className="text-sm text-[#5d7388]">Khách nhập mã ở trang thanh toán. Hủy đơn sẽ trả lại lượt dùng.</p>
      </div>
      {created ? <p className="text-sm font-semibold text-[#2f6f4e]">Đã tạo voucher.</p> : null}
      {error ? <p className="text-sm font-semibold text-[#8a3b3b]">{error}</p> : null}
      <section className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
        <h2 className="mb-3 font-extrabold">Tạo mã mới</h2>
        <VoucherForm />
      </section>
      {vouchers.length === 0 ? (
        <p className="rounded-3xl bg-white px-5 py-8 text-center text-sm text-[#5d7388] ring-1 ring-[#d5e3f0]">Chưa có voucher.</p>
      ) : (
        <ul className="grid gap-3">
          {vouchers.map((voucher) => (
            <li key={voucher.id} className="rounded-2xl bg-white p-4 ring-1 ring-[#d5e3f0]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold">{voucher.code}</p>
                  <p className="text-sm">
                    {offer(voucher.kind, voucher.value)}
                    {voucher.minSubtotal > 0 ? ` · đơn từ ${formatVnd(voucher.minSubtotal)}` : ""}
                  </p>
                  <p className="text-sm text-[#5d7388]">
                    Đã dùng {voucher.usedCount}
                    {voucher.usageLimit == null ? "" : ` / ${voucher.usageLimit}`}
                    {" · "}
                    {voucher.expiresAt ? `hết hạn ${formatWhen(voucher.expiresAt)}` : "không hạn"}
                    {voucher.active ? "" : " · đang tắt"}
                  </p>
                  {voucher.note ? <p className="mt-1 text-sm text-[#5d7388]">{voucher.note}</p> : null}
                </div>
                <div className="flex gap-2">
                  <form action={toggleVoucherAction}>
                    <input type="hidden" name="id" value={voucher.id} />
                    <input type="hidden" name="active" value={voucher.active ? "1" : "0"} />
                    <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-[#d5e3f0]">
                      {voucher.active ? "Tắt" : "Bật"}
                    </button>
                  </form>
                  {voucher.usedCount === 0 ? (
                    <form action={deleteVoucherAction}>
                      <input type="hidden" name="id" value={voucher.id} />
                      <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#8a3b3b] ring-1 ring-[#d5e3f0]">
                        Xóa
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
