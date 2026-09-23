import { CartView } from "@/components/cart-view";

export const metadata = { title: "Giỏ hàng" };

export default function CartPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Giỏ hàng</h1>
      <CartView />
    </div>
  );
}
