"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ClipboardList, LayoutDashboard, LogOut, Settings, Store, Ticket, Users } from "lucide-react";
import { logoutAction } from "@/app/actions/admin";

const items = [
  { href: "/admin", label: "Kho", icon: Boxes, exact: true },
  { href: "/admin/orders", label: "Đơn", icon: ClipboardList, exact: false },
  { href: "/admin/crm", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/crm/customers", label: "Khách hàng", icon: Users, exact: false },
  { href: "/admin/crm/vouchers", label: "Voucher", icon: Ticket, exact: false },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings, exact: false },
];

export function AdminSidebar({ freshOrders }: { freshOrders: number }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-dvh w-16 shrink-0 flex-col border-r border-[#d5e3f0] bg-white md:w-60">
      <Link href="/admin" className="flex items-center gap-2 px-3 py-4 md:px-4">
        <Image src="/logo.png" alt="" width={88} height={88} className="size-10 rounded-full" />
        <span className="hidden text-sm font-extrabold md:block">Maus Collect</span>
      </Link>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold md:justify-start md:px-3 ${
                active ? "bg-[#24344a] text-white" : "text-[#3e5870] hover:bg-[#eef4f9]"
              }`}
            >
              <span className="relative">
                <Icon className="size-5 shrink-0" />
                {item.href === "/admin/orders" && freshOrders > 0 ? (
                  <span className={`absolute -top-2 -right-2 rounded-full px-1 text-[10px] md:hidden ${active ? "bg-white text-[#24344a]" : "bg-[#24344a] text-white"}`}>
                    {freshOrders}
                  </span>
                ) : null}
              </span>
              <span className="hidden truncate md:block">{item.label}</span>
              {item.href === "/admin/orders" && freshOrders > 0 ? (
                <span className={`ml-auto hidden rounded-full px-1.5 text-xs md:inline ${active ? "bg-white text-[#24344a]" : "bg-[#24344a] text-white"}`}>
                  {freshOrders}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="grid gap-1 border-t border-[#d5e3f0] p-2">
        <Link
          href="/"
          title="Xem shop"
          className="flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-[#3e5870] hover:bg-[#eef4f9] md:justify-start md:px-3"
        >
          <Store className="size-5 shrink-0" />
          <span className="hidden md:block">Xem shop</span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            title="Đăng xuất"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-[#3e5870] hover:bg-[#eef4f9] md:justify-start md:px-3"
          >
            <LogOut className="size-5 shrink-0" />
            <span className="hidden md:block">Đăng xuất</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
