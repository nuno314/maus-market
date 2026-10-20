import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutUserAction } from "@/app/actions/account";
import { SubmitButton } from "@/components/submit-button";
import { currentUser } from "@/lib/current-user";
import { formatVnd, formatWhen } from "@/lib/money";
import { listUserOrders, type OrderStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

const statusLabel: Record<OrderStatus, string> = {
  new: "Mới",
  confirmed: "Đã xác nhận",
  done: "Hoàn tất",
  cancelled: "Hủy",
};

export const metadata = { title: "Tài khoản" };

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/account/login");
  const orders = await listUserOrders(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-[2rem] bg-white px-5 py-6 ring-1 ring-[#d5e3f0]">
        <p className="text-sm text-[#5d7388]">Đang đăng nhập</p>
        <h1 className="mt-1 text-2xl font-extrabold">{user.username}</h1>
        <form action={logoutUserAction} className="mt-4">
          <SubmitButton variant="outline" className="h-10 rounded-full">
            Đăng xuất
          </SubmitButton>
        </form>
      </section>
      <h2 className="mb-3 mt-6 text-xl font-extrabold">Đơn của bạn</h2>
      {orders.length === 0 ? (
        <p className="rounded-3xl bg-white px-5 py-8 text-center text-sm text-[#5d7388] ring-1 ring-[#d5e3f0]">
          Chưa có đơn. Đơn đặt khi đang đăng nhập sẽ hiện ở đây.
        </p>
      ) : (
        <ul className="grid gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/order/${order.code}`} className="block rounded-2xl bg-white p-4 ring-1 ring-[#d5e3f0]">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-extrabold">{order.code}</span>
                  <span className="text-sm font-semibold text-[#3e5870]">{statusLabel[order.status]}</span>
                </span>
                <span className="mt-1 block text-sm text-[#5d7388]">
                  {formatWhen(order.createdAt)} · {formatVnd(order.totalVnd)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
