import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { CardThumb } from "@/components/card-thumb";
import { ProductMeta } from "@/components/product-meta";
import { formatVnd, formatWhen } from "@/lib/money";
import { getOrder, type OrderStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

const statuses: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "Mới" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "done", label: "Hoàn tất" },
  { value: "cancelled", label: "Hủy" },
];

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(Number(id));
  if (!order) notFound();

  return (
    <div className="grid gap-4">
      <Link href="/admin/orders" className="text-sm font-semibold text-[#1a4f86]">
        Tất cả đơn
      </Link>
      <section className="rounded-3xl bg-white p-5 ring-1 ring-[#d5e3f0]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{order.code}</h1>
            <p className="text-sm text-[#5d7388]">{formatWhen(order.createdAt)}</p>
          </div>
          <div className="text-right">
            {order.discountVnd > 0 ? (
              <p className="text-sm text-[#2f6f4e]">
                Mã {order.voucherCode} −{formatVnd(order.discountVnd)}
              </p>
            ) : null}
            <p className="text-xl font-extrabold">{formatVnd(order.totalVnd)}</p>
          </div>
        </div>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[#5d7388]">Tên Zalo</dt>
            <dd className="font-semibold">{order.zaloName}</dd>
          </div>
          <div>
            <dt className="text-[#5d7388]">SĐT Zalo</dt>
            <dd className="font-semibold">{order.zaloPhone}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[#5d7388]">Giao hàng</dt>
            <dd className="font-semibold">
              {order.shippingMethod === "manual" ? `Nhập tay · ${order.shippingAddress}` : "Thảo luận sau"}
            </dd>
          </div>
        </dl>
        <form action={updateOrderStatusAction} className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="id" value={order.id} />
          {statuses.map((status) => (
            <button
              key={status.value}
              type="submit"
              name="status"
              value={status.value}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${
                order.status === status.value ? "bg-[#24344a] text-white ring-[#24344a]" : "bg-white ring-[#d5e3f0]"
              }`}
            >
              {status.label}
            </button>
          ))}
        </form>
        {order.status !== "cancelled" ? (
          <p className="mt-2 text-xs text-[#5d7388]">Hủy đơn sẽ trả số lượng về kho.</p>
        ) : null}
      </section>
      <ul className="grid gap-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-[#d5e3f0]">
            <CardThumb src={item.imageUrl} alt={item.cardName} className="h-24 w-16 rounded-lg" />
            <div>
              <p className="font-bold">{item.cardName}</p>
              {item.description ? <p className="line-clamp-2 text-xs text-[#5d7388]">{item.description}</p> : null}
              <ProductMeta
                item={{
                  setCode: item.setCode,
                  setName: item.setName,
                  number: item.number,
                  category: item.category,
                  condition: item.condition,
                }}
              />
              <p className="mt-2 text-sm font-bold">
                {item.quantity} × {formatVnd(item.unitPriceVnd)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
