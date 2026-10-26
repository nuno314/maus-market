import Link from "next/link";
import { Input } from "@/components/ui/input";
import { listCustomers } from "@/lib/crm";
import { formatVnd, formatWhen } from "@/lib/money";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = one((await searchParams).q);
  const { buyers, accounts } = await listCustomers(query);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">Khách hàng</h1>
        <p className="text-sm text-[#5d7388]">Gom theo số Zalo. Chi tiêu không tính đơn hủy.</p>
      </div>
      <form action="/admin/crm/customers" className="flex gap-2">
        <Input name="q" defaultValue={query} placeholder="Tên, số Zalo hoặc tài khoản" className="h-11 rounded-full" aria-label="Tìm khách" />
        <button type="submit" className="h-11 shrink-0 rounded-full bg-[#24344a] px-4 text-sm font-semibold text-white">
          Tìm
        </button>
      </form>
      {buyers.length === 0 ? (
        <p className="rounded-3xl bg-white px-5 py-8 text-center text-sm text-[#5d7388] ring-1 ring-[#d5e3f0]">
          {query ? "Không có khách khớp." : "Chưa có khách đặt đơn."}
        </p>
      ) : (
        <ul className="grid gap-3">
          {buyers.map((customer) => (
            <li key={customer.phone}>
              <Link
                href={`/admin/crm/customers/${encodeURIComponent(customer.phone)}`}
                className="block rounded-2xl bg-white p-4 ring-1 ring-[#d5e3f0] hover:ring-[#8eb8d6]"
              >
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold">{customer.name}</span>
                  <span className="font-bold">{formatVnd(customer.spent)}</span>
                </span>
                <span className="mt-1 block text-sm text-[#5d7388]">
                  {customer.phone}
                  {customer.usernames.length > 0 ? ` · ${customer.usernames.join(", ")}` : ""}
                </span>
                <span className="mt-1 block text-sm">
                  {customer.orderCount} đơn · gần nhất {formatWhen(customer.lastOrderAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {accounts.length > 0 ? (
        <section>
          <h2 className="mb-3 font-extrabold">Tài khoản chưa đặt đơn</h2>
          <ul className="grid gap-2">
            {accounts.map((account) => (
              <li key={account.id} className="rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-[#d5e3f0]">
                <span className="font-bold">{account.username}</span>
                <span className="text-[#5d7388]"> · đăng ký {formatWhen(account.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
