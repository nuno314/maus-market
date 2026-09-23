import Image from "next/image";
import { LoginForm } from "@/components/admin-forms";

export const metadata = { title: "Đăng nhập admin" };

export default function LoginPage() {
  return (
    <main className="grid min-h-full flex-1 place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 ring-1 ring-[#d5e3f0]">
        <Image src="/logo.png" alt="Maus Collect" width={192} height={192} priority className="mx-auto size-24 rounded-full" />
        <h1 className="mt-3 text-center text-2xl font-extrabold">Maus Collect</h1>
        <p className="mb-4 text-center text-sm text-[#5d7388]">Đăng nhập để đăng thẻ và xem đơn.</p>
        <LoginForm />
      </div>
    </main>
  );
}
