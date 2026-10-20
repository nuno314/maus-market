"use client";

import { useState } from "react";
import { CardThumb } from "@/components/card-thumb";

export function ProductGallery({ images, alt, className }: { images: string[]; alt: string; className?: string }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const current = images[Math.min(index, Math.max(count - 1, 0))] ?? "";

  return (
    <div className="relative">
      <CardThumb src={current} alt={alt} className={className} />
      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Ảnh trước"
            className="absolute left-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-sm font-bold text-[#24344a] shadow-sm"
            onClick={() => setIndex((value) => (value - 1 + count) % count)}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Ảnh sau"
            className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-sm font-bold text-[#24344a] shadow-sm"
            onClick={() => setIndex((value) => (value + 1) % count)}
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
            {images.map((url, dot) => (
              <button
                key={`${url}-${dot}`}
                type="button"
                aria-label={`Ảnh ${dot + 1}`}
                aria-current={dot === index}
                className={`h-1.5 rounded-full ${dot === index ? "w-4 bg-[#24344a]" : "w-1.5 bg-white/80 ring-1 ring-[#24344a]/30"}`}
                onClick={() => setIndex(dot)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
