"use server";

import { revalidatePath } from "next/cache";
import { placeOrder } from "@/lib/store";
import { cleanPhone, isValidName, isValidPhone } from "@/lib/validate";

export type CheckoutResult = { ok: true; code: string } | { ok: false; error: string };

export async function placeOrderAction(formData: FormData): Promise<CheckoutResult> {
  const zaloName = String(formData.get("zaloName") ?? "").trim();
  const zaloPhone = cleanPhone(String(formData.get("zaloPhone") ?? ""));
  const shippingMethod = String(formData.get("shippingMethod") ?? "");
  const shippingAddress = String(formData.get("shippingAddress") ?? "").trim();

  if (!isValidName(zaloName)) {
    return { ok: false, error: "Nhập tên Zalo từ 2 ký tự." };
  }
  if (!isValidPhone(zaloPhone)) {
    return { ok: false, error: "Số điện thoại Zalo cần 9 đến 12 chữ số." };
  }
  if (shippingMethod !== "manual" && shippingMethod !== "later") {
    return { ok: false, error: "Chọn phương thức giao hàng." };
  }
  if (shippingMethod === "manual" && shippingAddress.length < 5) {
    return { ok: false, error: "Nhập địa chỉ giao hàng." };
  }

  let parsed: { listingId: number; quantity: number }[] = [];
  try {
    const raw = JSON.parse(String(formData.get("lines") ?? "[]")) as unknown;
    if (!Array.isArray(raw)) throw new Error("bad");
    parsed = raw.map((line) => {
      const item = line as { listingId?: number; quantity?: number };
      return {
        listingId: Number(item.listingId),
        quantity: Number(item.quantity),
      };
    });
  } catch {
    return { ok: false, error: "Giỏ hàng không đọc được. Thử thêm lại." };
  }

  const lines = parsed.filter(
    (line) => Number.isInteger(line.listingId) && line.listingId > 0 && Number.isInteger(line.quantity) && line.quantity > 0,
  );
  if (lines.length === 0 || lines.length > 40) {
    return { ok: false, error: "Giỏ đang trống." };
  }

  try {
    const order = placeOrder({
      lines,
      zaloPhone,
      zaloName,
      shippingMethod,
      shippingAddress: shippingMethod === "manual" ? shippingAddress : null,
    });
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    return { ok: true, code: order.code };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không tạo được đơn.",
    };
  }
}
