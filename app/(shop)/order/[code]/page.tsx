import Link from "next/link";
import { notFound } from "next/navigation";
import { CardThumb } from "@/components/card-thumb";
import { ProductMeta } from "@/components/product-meta";
import { formatVnd, formatWhen } from "@/lib/money";
import { getOrderByCode } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await getOrderByCode(code);
  if (!order) notFound();
  const shipping =
    order.shippingMethod === "manual" ? order.shippingAddress || "Nhập tay" : "Thảo luận sau trên Zalo";

  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-[2rem] bg-white px-5 py-6 ring-1 ring-[#d5e3f0]">
        <p className="text-sm font-bold text-[#2f6f4e]">Đơn đã gửi cho admin</p>
        <h1 className="mt-1 text-3xl font-extrabold">{order.code}</h1>
        <p className="mt-2 text-sm text-[#5d7388]">
          {order.zaloName} · {order.zaloPhone} · {formatWhen(order.createdAt)}
        </p>
        <p className="mt-3 text-sm">
          Giao hàng: <span className="font-semibold">{shipping}</span>
        </p>
        <p className="mt-2 text-sm text-[#5d7388]">Giữ mã đơn này khi nhắn Zalo với shop.</p>
      </section>
      <ul className="mt-4 grid gap-3">
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
      <p className="mt-4 text-right text-xl font-extrabold">{formatVnd(order.totalVnd)}</p>
      <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-[#1a4f86]">
        Tiếp tục xem thẻ
      </Link>
    </div>
  );
}
