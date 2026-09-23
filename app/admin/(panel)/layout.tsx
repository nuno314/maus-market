import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/actions/admin";
import { countNewOrders } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const fresh = countNewOrders();
  return (
    <div className="min-h-full flex-1">
      <header className="border-b border-[#d5e3f0] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={88} height={88} className="size-11 rounded-full" />
            <span className="font-extrabold">Maus Collect</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-semibold">
            <AdminLink href="/admin">Kho</AdminLink>
            <AdminLink href="/admin/orders">
              Đơn
              {fresh > 0 ? (
                <span className="ml-1 rounded-full bg-[#24344a] px-1.5 text-xs text-white">{fresh}</span>
              ) : null}
            </AdminLink>
            <AdminLink href="/admin/settings">Cài đặt</AdminLink>
            <Link href="/" className="rounded-full px-3 py-1.5 text-[#3e5870]">
              Xem shop
            </Link>
          </nav>
          <form action={logoutAction} className="ml-auto">
            <button type="submit" className="text-sm font-semibold text-[#3e5870]">
              Đăng xuất
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}

function AdminLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center rounded-full px-3 py-1.5 hover:bg-[#eef4f9]">
      {children}
    </Link>
  );
}
