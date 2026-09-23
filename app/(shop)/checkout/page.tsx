import { CheckoutForm } from "@/components/checkout-form";

export const metadata = { title: "Thanh toán" };

export default function CheckoutPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold">Thanh toán</h1>
      <p className="mb-4 text-sm text-[#5d7388]">Gửi số Zalo. Shop không trừ tiền trên web.</p>
      <CheckoutForm />
    </div>
  );
}
