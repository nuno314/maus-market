import type { Client } from "@libsql/client";
import { desc, eq } from "drizzle-orm";
import { getClient, getDb } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { vouchers } from "@/lib/schema";

export type VoucherKind = "percent" | "amount";

export type VoucherRow = {
  id: number;
  code: string;
  kind: VoucherKind;
  value: number;
  minSubtotal: number;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  note: string;
  createdAt: string;
};

type VoucherRecord = {
  code: string;
  kind: VoucherKind;
  value: number;
  minSubtotal: number;
  usageLimit: number | null;
  usedCount: number;
  active: number;
  expiresAt: string | null;
};

export function normalizeVoucherCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidVoucherCode(code: string) {
  return /^[A-Z0-9]{3,16}$/.test(code);
}

export function discountFor(
  voucher: { kind: VoucherKind; value: number; minSubtotal: number },
  subtotal: number,
): { ok: true; discount: number } | { ok: false; error: string } {
  if (subtotal < voucher.minSubtotal) {
    return { ok: false, error: `Đơn cần từ ${formatVnd(voucher.minSubtotal)} để dùng mã này.` };
  }
  const discount =
    voucher.kind === "percent" ? Math.round((subtotal * voucher.value) / 100) : Math.min(voucher.value, subtotal);
  if (!Number.isFinite(discount) || discount < 1) {
    return { ok: false, error: "Mã này không giảm được đơn hiện tại." };
  }
  return { ok: true, discount };
}

function asKind(value: string): VoucherKind {
  return value === "amount" ? "amount" : "percent";
}

function voucherProblem(row: VoucherRecord, subtotal: number, now: string) {
  if (Number(row.active) !== 1) return "Mã giảm giá không còn hiệu lực.";
  if (row.expiresAt && row.expiresAt < now) return "Mã giảm giá đã hết hạn.";
  if (row.usageLimit != null && Number(row.usedCount) >= Number(row.usageLimit)) return "Mã giảm giá đã hết lượt.";
  const priced = discountFor(
    { kind: asKind(row.kind), value: Number(row.value), minSubtotal: Number(row.minSubtotal) },
    subtotal,
  );
  if (!priced.ok) return priced.error;
  return null;
}

function mapRecord(row: Record<string, unknown>): VoucherRecord {
  return {
    code: String(row.code),
    kind: asKind(String(row.kind)),
    value: Number(row.value),
    minSubtotal: Number(row.minSubtotal ?? row.min_subtotal ?? 0),
    usageLimit: row.usageLimit == null && row.usage_limit == null ? null : Number(row.usageLimit ?? row.usage_limit),
    usedCount: Number(row.usedCount ?? row.used_count ?? 0),
    active: Number(row.active),
    expiresAt: (row.expiresAt ?? row.expires_at ?? null) as string | null,
  };
}

const VOUCHER_SQL = `SELECT code, kind, value, min_subtotal as minSubtotal, usage_limit as usageLimit,
  used_count as usedCount, active, expires_at as expiresAt
  FROM vouchers WHERE code = ?`;

export async function quoteVoucher(code: string, subtotal: number) {
  const normalized = normalizeVoucherCode(code);
  if (!isValidVoucherCode(normalized)) return { ok: false as const, error: "Mã giảm giá không hợp lệ." };
  if (!Number.isInteger(subtotal) || subtotal < 1) return { ok: false as const, error: "Đơn chưa đủ để áp mã." };
  const client = await getClient();
  const found = await client.execute({ sql: VOUCHER_SQL, args: [normalized] });
  const row = found.rows[0] as unknown as VoucherRecord | undefined;
  if (!row) return { ok: false as const, error: "Không tìm thấy mã giảm giá." };
  const record = mapRecord(row as unknown as Record<string, unknown>);
  const problem = voucherProblem(record, subtotal, new Date().toISOString());
  if (problem) return { ok: false as const, error: problem };
  const priced = discountFor(record, subtotal);
  if (!priced.ok) return priced;
  return { ok: true as const, code: normalized, discount: priced.discount, kind: record.kind, value: record.value };
}

export async function lockVoucher(sqlite: Pick<Client, "execute">, code: string, subtotal: number, now: string) {
  const found = await sqlite.execute({ sql: VOUCHER_SQL, args: [code] });
  const raw = found.rows[0] as unknown as VoucherRecord | undefined;
  if (!raw) throw new Error("Không tìm thấy mã giảm giá.");
  const row = mapRecord(raw as unknown as Record<string, unknown>);
  const problem = voucherProblem(row, subtotal, now);
  if (problem) throw new Error(problem);
  const priced = discountFor(row, subtotal);
  if (!priced.ok) throw new Error(priced.error);
  const updated = await sqlite.execute({
    sql: `UPDATE vouchers SET used_count = used_count + 1
          WHERE code = ? AND active = 1 AND used_count = ?
            AND (usage_limit IS NULL OR used_count < usage_limit)
            AND (expires_at IS NULL OR expires_at >= ?)`,
    args: [code, row.usedCount, now],
  });
  if (Number(updated.rowsAffected) !== 1) throw new Error("Mã giảm giá vừa hết lượt. Thử lại.");
  return { code, discount: priced.discount };
}

export async function releaseVoucher(sqlite: Pick<Client, "execute">, code: string) {
  await sqlite.execute({
    sql: `UPDATE vouchers SET used_count = used_count - 1 WHERE code = ? AND used_count > 0`,
    args: [code],
  });
}

function mapVoucher(row: typeof vouchers.$inferSelect): VoucherRow {
  return {
    id: row.id,
    code: row.code,
    kind: asKind(row.kind),
    value: row.value,
    minSubtotal: row.minSubtotal,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    active: row.active === 1,
    expiresAt: row.expiresAt,
    note: row.note,
    createdAt: row.createdAt,
  };
}

export async function listVouchers(): Promise<VoucherRow[]> {
  const db = await getDb();
  const rows = await db.select().from(vouchers).orderBy(desc(vouchers.id)).all();
  return rows.map(mapVoucher);
}

export async function countActiveVouchers(now = new Date().toISOString()) {
  const client = await getClient();
  const result = await client.execute({
    sql: `SELECT COUNT(*) as count FROM vouchers
          WHERE active = 1 AND (expires_at IS NULL OR expires_at >= ?)`,
    args: [now],
  });
  return Number(result.rows[0]?.count ?? 0);
}

export async function createVoucher(input: {
  code: string;
  kind: VoucherKind;
  value: number;
  minSubtotal: number;
  usageLimit: number | null;
  expiresAt: string | null;
  note: string;
}) {
  const code = normalizeVoucherCode(input.code);
  if (!isValidVoucherCode(code)) throw new Error("Mã gồm 3–16 chữ hoặc số, không dấu.");
  if (input.kind !== "percent" && input.kind !== "amount") throw new Error("Chọn loại giảm giá.");
  if (input.kind === "percent" && (!Number.isInteger(input.value) || input.value < 1 || input.value > 100)) {
    throw new Error("Phần trăm giảm từ 1 đến 100.");
  }
  if (input.kind === "amount" && (!Number.isInteger(input.value) || input.value < 1000 || input.value > 100_000_000)) {
    throw new Error("Số tiền giảm từ 1.000đ đến 100.000.000đ.");
  }
  if (!Number.isInteger(input.minSubtotal) || input.minSubtotal < 0 || input.minSubtotal > 100_000_000) {
    throw new Error("Đơn tối thiểu không hợp lệ.");
  }
  if (input.usageLimit != null && (!Number.isInteger(input.usageLimit) || input.usageLimit < 1 || input.usageLimit > 100_000)) {
    throw new Error("Số lượt dùng từ 1 đến 100.000, hoặc để trống.");
  }
  const db = await getDb();
  const existing = await db.select({ id: vouchers.id }).from(vouchers).where(eq(vouchers.code, code)).get();
  if (existing) throw new Error("Mã này đã có.");
  await db
    .insert(vouchers)
    .values({
      code,
      kind: input.kind,
      value: input.value,
      minSubtotal: input.minSubtotal,
      usageLimit: input.usageLimit,
      usedCount: 0,
      active: 1,
      expiresAt: input.expiresAt,
      note: input.note.slice(0, 200),
      createdAt: new Date().toISOString(),
    })
    .run();
}

export async function setVoucherActive(id: number, active: boolean) {
  const db = await getDb();
  await db.update(vouchers).set({ active: active ? 1 : 0 }).where(eq(vouchers.id, id)).run();
}

export async function deleteVoucher(id: number) {
  const db = await getDb();
  const row = await db.select().from(vouchers).where(eq(vouchers.id, id)).get();
  if (!row) return "Không thấy voucher.";
  if (row.usedCount > 0) return "Voucher đã có người dùng. Hãy tắt thay vì xóa.";
  await db.delete(vouchers).where(eq(vouchers.id, id)).run();
  return null;
}
