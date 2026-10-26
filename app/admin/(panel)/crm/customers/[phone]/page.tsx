import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/crm";
import { formatVnd, formatWhen } from "@/lib/money";
import type { OrderStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

const statusLabel: Record<OrderStatus, string> = {
  new: "Mới",
  confirmed: "Đã xác nhận",
  done: "Hoàn tất",
  cancelled: "Hủy",
};

export default async function CustomerPage({ params }: { params: Promise<{ phone: string }> }) {
  const { phone } = await params;
  const customer = await getCustomer(decodeURIComponent(phone));
  if (!customer) notFound();
  const digits = customer.phone.replace(/\D/g, "");

  return (
    <div className="grid gap-4">
      <Link href="/admin/crm/customers" className="text-sm font-semibold text-[#1a4f86]">
        Tất cả khách
      </Link>
      <section className="rounded-3xl bg-white p-5 ring-1 ring-[#d5e3f0]">
        <h1 className="text-2xl font-extrabold">{customer.name}</h1>
        <p className="mt-1 text-sm text-[#5d7388]">
          {customer.phone}
          {customer.usernames.length > 0 ? ` · tài khoản ${customer.usernames.join(", ")}` : " · chưa có tài khoản"}
        </p>
        <p className="mt-3 font-bold">
          {customer.orderCount} đơn · đã chi {formatVnd(customer.spent)}
        </p>
        {digits ? (
          <a href={`https://zalo.me/${digits}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-[#1a4f86]">
            Mở Zalo
          </a>
        ) : null}
      </section>
      <ul className="grid gap-3">
        {customer.orders.map((order) => (
          <li key={order.id}>
            <Link href={`/admin/orders/${order.id}`} className="block rounded-2xl bg-white p-4 ring-1 ring-[#d5e3f0] hover:ring-[#8eb8d6]">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-extrabold">{order.code}</span>
                <span className="rounded-full bg-[#e7f1f8] px-2 py-0.5 text-xs font-bold text-[#1a4f86]">
                  {statusLabel[order.status]}
                </span>
              </span>
              <span className="mt-1 block text-sm text-[#5d7388]">{formatWhen(order.createdAt)}</span>
              <span className="mt-1 block text-sm font-bold">
                {formatVnd(order.totalVnd)}
                {order.discountVnd > 0 ? ` · mã ${order.voucherCode} giảm ${formatVnd(order.discountVnd)}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
