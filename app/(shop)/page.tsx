import Image from "next/image";
import { ShopBrowser } from "@/components/shop-browser";
import { listShopListings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const listings = await listShopListings();
  return (
    <div>
      <section className="overflow-hidden rounded-[2rem] bg-white px-5 py-6 ring-1 ring-[#d5e3f0] sm:px-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Image src="/logo.png" alt="" width={256} height={256} priority className="size-28 rounded-full bg-white sm:size-32" />
          <div>
            <p className="text-sm font-bold tracking-wide text-[#5d86ab]">MEGA EVOLUTION</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#1c2b3a] sm:text-4xl">
              Thẻ đang có tại Maus Collect
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5d7388] sm:text-base">
              Lọc theo mùa, tìm tên lá, xem ảnh rồi thêm vào giỏ. Giá tiếng Anh bám TCGPlayer, tiếng Nhật bám Cardrush.
            </p>
          </div>
        </div>
      </section>
      <ShopBrowser listings={listings} />
    </div>
  );
}
