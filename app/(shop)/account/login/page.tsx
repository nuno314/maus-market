import { redirect } from "next/navigation";
import { LoginUserForm } from "@/components/account-forms";
import { currentUser } from "@/lib/current-user";

export const metadata = { title: "Đăng nhập" };

export default async function AccountLoginPage() {
  if (await currentUser()) redirect("/account");
  return (
    <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-white p-6 ring-1 ring-[#d5e3f0]">
      <h1 className="text-2xl font-extrabold">Đăng nhập</h1>
      <p className="mb-4 mt-1 text-sm text-[#5d7388]">Dùng username và mật khẩu đã đăng ký.</p>
      <LoginUserForm />
    </div>
  );
}
