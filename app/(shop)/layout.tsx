import { CartProvider } from "@/components/cart-provider";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <SiteFooter />
    </CartProvider>
  );
}
