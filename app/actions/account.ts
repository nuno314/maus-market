"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/password";
import { USER_COOKIE, signUserSession } from "@/lib/session";
import { createUser, findUserByUsername, isValidPassword, isValidUsername, normalizeUsername } from "@/lib/users";

export type AccountState = { error?: string } | null;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

async function startSession(userId: number, username: string) {
  const jar = await cookies();
  jar.set(USER_COOKIE, await signUserSession(userId, username), cookieOptions);
}

export async function registerUserAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!isValidUsername(username)) {
    return { error: "Username từ 3 đến 24 ký tự, chỉ chữ, số và dấu _." };
  }
  if (!isValidPassword(password)) {
    return { error: "Mật khẩu từ 6 đến 64 ký tự." };
  }
  if (await findUserByUsername(username)) {
    return { error: "Username này đã có người dùng." };
  }
  const user = await createUser(username, password);
  if (!user) return { error: "Không tạo được tài khoản." };
  await startSession(user.id, user.username);
  redirect("/account");
}

export async function loginUserAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const user = username ? await findUserByUsername(username) : null;
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Sai username hoặc mật khẩu." };
  }
  await startSession(user.id, user.username);
  redirect("/account");
}

export async function logoutUserAction() {
  const jar = await cookies();
  jar.delete(USER_COOKIE);
  redirect("/");
}
