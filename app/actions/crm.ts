"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, readSession } from "@/lib/session";
import { parseVnd } from "@/lib/validate";
import { createVoucher, deleteVoucher, setVoucherActive, type VoucherKind } from "@/lib/vouchers";

export type ActionState = { error?: string; ok?: string } | null;

async function requireAdmin() {
  const jar = await cookies();
  const session = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");
}

function refreshCrm() {
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/vouchers");
  revalidatePath("/checkout");
}

function parseExpiry(value: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Ngày hết hạn không hợp lệ.");
  const date = new Date(`${value}T23:59:59+07:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Ngày hết hạn không hợp lệ.");
  if (date.getTime() < Date.now()) throw new Error("Ngày hết hạn phải từ hôm nay trở đi.");
  return date.toISOString();
}

export async function createVoucherAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const kind = String(formData.get("kind") ?? "") as VoucherKind;
  const rawValue = String(formData.get("value") ?? "");
  const value = kind === "percent" ? Number(rawValue) : parseVnd(rawValue);
  const minRaw = String(formData.get("minSubtotal") ?? "").trim();
  const minSubtotal = minRaw ? parseVnd(minRaw) : 0;
  const limitRaw = String(formData.get("usageLimit") ?? "").trim();
  const usageLimit = limitRaw ? Number(limitRaw) : null;
  if (minRaw && minSubtotal == null) return { error: "Đơn tối thiểu từ 1.000đ, hoặc để trống." };
  if (value == null) return { error: kind === "percent" ? "Nhập phần trăm giảm." : "Nhập số tiền giảm." };
  try {
    await createVoucher({
      code: String(formData.get("code") ?? ""),
      kind,
      value,
      minSubtotal: minSubtotal ?? 0,
      usageLimit,
      expiresAt: parseExpiry(String(formData.get("expiresAt") ?? "")),
      note: String(formData.get("note") ?? "").trim(),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Không tạo được voucher." };
  }
  refreshCrm();
  redirect("/admin/crm/vouchers?created=1");
}

export async function toggleVoucherAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const active = String(formData.get("active") ?? "") === "1";
  if (!Number.isInteger(id) || id < 1) redirect("/admin/crm/vouchers");
  await setVoucherActive(id, !active);
  refreshCrm();
  redirect("/admin/crm/vouchers");
}

export async function deleteVoucherAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) redirect("/admin/crm/vouchers");
  const error = await deleteVoucher(id);
  refreshCrm();
  if (error) redirect(`/admin/crm/vouchers?error=${encodeURIComponent(error)}`);
  redirect("/admin/crm/vouchers");
}
