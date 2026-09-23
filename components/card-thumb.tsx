"use client";

/* Card art comes from TCGdex, Cardrush, or a link the admin pastes. */

import { useState } from "react";
import { cardImageSrc } from "@/lib/images";
import { cn } from "@/lib/utils";

export function CardThumb({
  src,
  alt,
  className,
  size = "low",
}: {
  src: string;
  alt: string;
  className?: string;
  size?: "low" | "high";
}) {
  const [failed, setFailed] = useState(false);
  const resolved = cardImageSrc(src, size);
  if (!resolved || failed) {
    return (
      <div className={cn("grid place-items-center bg-[#e7f1f8] px-2 text-center text-xs text-[#5c7286]", className)}>
        Chưa có ảnh
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={cn("bg-white object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}
