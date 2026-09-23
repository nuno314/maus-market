import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center px-4 py-16 text-center">
      <div>
        <Image src="/logo.png" alt="" width={160} height={160} className="mx-auto size-20 rounded-full" />
        <h1 className="mt-3 text-2xl font-extrabold">Không thấy trang này</h1>
        <Link href="/" className="mt-4 inline-flex h-10 items-center rounded-full bg-[#24344a] px-4 text-sm font-semibold text-white">
          Về Maus Collect
        </Link>
      </div>
    </main>
  );
}
