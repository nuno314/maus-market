"use client";

import { useActionState, useState } from "react";
import { createVoucherAction } from "@/app/actions/crm";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const field = "h-11 rounded-xl bg-white";
const selectClass = `${field} w-full border border-[#d5e3f0] px-3`;

export function VoucherForm() {
  const [state, action] = useActionState(createVoucherAction, null);
  const [kind, setKind] = useState<"percent" | "amount">("percent");

  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="code">Mã</Label>
          <Input id="code" name="code" required minLength={3} maxLength={16} className={field} placeholder="MEGA10" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="kind">Loại</Label>
          <select
            id="kind"
            name="kind"
            className={selectClass}
            value={kind}
            onChange={(event) => setKind(event.target.value as "percent" | "amount")}
          >
            <option value="percent">Giảm theo %</option>
            <option value="amount">Giảm số tiền</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="value">{kind === "percent" ? "Phần trăm" : "Số tiền (VND)"}</Label>
          <Input
            id="value"
            name="value"
            required
            inputMode="numeric"
            className={field}
            placeholder={kind === "percent" ? "10" : "50000"}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="minSubtotal">Đơn tối thiểu (VND)</Label>
          <Input id="minSubtotal" name="minSubtotal" inputMode="numeric" className={field} placeholder="Để trống nếu không cần" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="usageLimit">Số lượt</Label>
          <Input id="usageLimit" name="usageLimit" inputMode="numeric" className={field} placeholder="Không giới hạn" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="expiresAt">Hết hạn</Label>
          <Input id="expiresAt" name="expiresAt" type="date" className={field} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="note">Ghi chú</Label>
        <Input id="note" name="note" maxLength={200} className={field} placeholder="Khách cũ, livestream..." />
      </div>
      {state?.error ? <p className="text-sm font-semibold text-[#8a3b3b]">{state.error}</p> : null}
      <SubmitButton className="h-11 rounded-full" pendingLabel="Đang tạo…">
        Tạo voucher
      </SubmitButton>
    </form>
  );
}
