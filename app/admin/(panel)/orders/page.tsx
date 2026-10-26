import Link from "next/link";
import { formatVnd, formatWhen } from "@/lib/money";
import { listOrders, type OrderStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

const statusLabel: Record<OrderStatus, string> = {
  new: "Mới",
  confirmed: "Đã xác nhận",
  done: "Hoàn tất",
  cancelled: "Hủy",
};

export default async function OrdersPage() {
  const orders = await listOrders();
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Đơn hàng</h1>
      <p className="mb-4 text-sm text-[#5d7388]">Đơn mới nhất ở trên. Bấm vào để xem Zalo và lá bài.</p>
      {orders.length === 0 ? (
        <p className="rounded-3xl bg-white px-5 py-8 text-center text-sm text-[#5d7388] ring-1 ring-[#d5e3f0]">
          Chưa có đơn nào.
        </p>
      ) : (
        <ul className="grid gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/admin/orders/${order.id}`} className="block rounded-2xl bg-white p-4 ring-1 ring-[#d5e3f0] hover:ring-[#8eb8d6]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold">{order.code}</p>
                  <span className="rounded-full bg-[#e7f1f8] px-2 py-0.5 text-xs font-bold text-[#1a4f86]">
                    {statusLabel[order.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  {order.zaloName} · {order.zaloPhone}
                </p>
                <p className="text-sm text-[#5d7388]">
                  {order.shippingMethod === "manual" ? "Nhập tay" : "Thảo luận sau"} · {formatWhen(order.createdAt)}
                </p>
                <p className="mt-2 font-bold">
                  {order.itemCount} dòng · {formatVnd(order.totalVnd)}
                  {order.discountVnd > 0 ? ` · mã ${order.voucherCode}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
