import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: {
    default: "Maus Collect",
    template: "%s · Maus Collect",
  },
  description: "Shop thẻ Pokémon Mega Evolution. Giá tiếng Anh theo TCGPlayer, tiếng Nhật theo Cardrush.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#f3f7fb] font-sans text-[#1b2a3b]">{children}</body>
    </html>
  );
}
