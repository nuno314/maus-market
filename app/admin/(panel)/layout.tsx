import { AdminSidebar } from "@/components/admin-sidebar";
import { countNewOrders } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const fresh = await countNewOrders();
  return (
    <div className="flex min-h-screen flex-1">
      <AdminSidebar freshOrders={fresh} />
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
