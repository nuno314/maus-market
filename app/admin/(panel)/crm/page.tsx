import Link from "next/link";
import { ProductChart, RevenueChart, StatusChart } from "@/components/crm-charts";
import { crmDashboard } from "@/lib/crm";
import { formatVnd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const data = await crmDashboard();
  const cards = [
    { label: "Doanh thu 30 ngày", value: formatVnd(data.revenue30) },
    { label: "Đơn 30 ngày", value: String(data.orders30) },
    { label: "Khách mới 30 ngày", value: String(data.newCustomers30) },
    { label: "Voucher đang mở", value: String(data.activeVouchers) },
  ];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">Tổng quan</h1>
        <p className="text-sm text-[#5d7388]">
          {data.customers} khách đã đặt. Doanh thu không tính đơn hủy và đã trừ voucher.
        </p>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-3xl bg-white px-4 py-4 ring-1 ring-[#d5e3f0]">
            <p className="text-sm text-[#5d7388]">{card.label}</p>
            <p className="mt-1 text-xl font-extrabold">{card.value}</p>
          </article>
        ))}
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
          <h2 className="font-extrabold">Doanh thu 14 ngày</h2>
          <div className="mt-4">
            <RevenueChart days={data.days} />
          </div>
        </section>
        <section className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
          <h2 className="font-extrabold">Đơn theo trạng thái</h2>
          <div className="mt-4">
            <StatusChart slices={data.statuses} />
          </div>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
          <h2 className="font-extrabold">Sản phẩm bán nhiều</h2>
          {data.topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-[#5d7388]">Chưa có đơn để xếp hạng.</p>
          ) : (
            <div className="mt-4">
              <ProductChart products={data.topProducts} />
            </div>
          )}
        </section>
        <section className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-extrabold">Voucher gần đây</h2>
            <Link href="/admin/crm/vouchers" className="text-sm font-semibold text-[#1a4f86]">
              Quản lý
            </Link>
          </div>
          {data.vouchers.length === 0 ? (
            <p className="mt-3 text-sm text-[#5d7388]">Chưa có mã. Tạo mã để khách nhập lúc thanh toán.</p>
          ) : (
            <ul className="mt-3 grid gap-2 text-sm">
              {data.vouchers.map((voucher) => (
                <li key={voucher.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f4f8fb] px-3 py-2">
                  <span className="font-bold">{voucher.code}</span>
                  <span className="text-[#5d7388]">
                    {voucher.kind === "percent" ? `${voucher.value}%` : formatVnd(voucher.value)} · {voucher.usedCount} lượt
                    {voucher.active ? "" : " · tắt"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
