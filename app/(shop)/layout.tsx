import { CartProvider } from "@/components/cart-provider";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { currentUser } from "@/lib/current-user";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <CartProvider>
      <SiteHeader username={user?.username ?? null} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <SiteFooter />
    </CartProvider>
  );
}
