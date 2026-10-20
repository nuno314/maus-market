"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginUserAction, registerUserAction } from "@/app/actions/account";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const field = "h-11 rounded-xl bg-white";

export function LoginUserForm() {
  const [state, action] = useActionState(loginUserAction, null);
  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required className={field} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className={field} />
      </div>
      {state?.error ? <p className="text-sm font-semibold text-[#8a3b3b]">{state.error}</p> : null}
      <SubmitButton className="h-11 rounded-full">Đăng nhập</SubmitButton>
      <p className="text-center text-sm text-[#5d7388]">
        Chưa có tài khoản?{" "}
        <Link href="/account/register" className="font-semibold text-[#1c2b3a]">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}

export function RegisterUserForm() {
  const [state, action] = useActionState(registerUserAction, null);
  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required className={field} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} className={field} />
      </div>
      {state?.error ? <p className="text-sm font-semibold text-[#8a3b3b]">{state.error}</p> : null}
      <SubmitButton className="h-11 rounded-full">Tạo tài khoản</SubmitButton>
      <p className="text-center text-sm text-[#5d7388]">
        Đã có tài khoản?{" "}
        <Link href="/account/login" className="font-semibold text-[#1c2b3a]">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
