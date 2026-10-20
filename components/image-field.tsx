"use client";

import { useState } from "react";
import { CardThumb } from "@/components/card-thumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_PRODUCT_IMAGES } from "@/lib/images";

const field = "h-11 rounded-xl bg-white";

export function ImageField({
  initial,
  onBusyChange,
}: {
  initial: string[];
  onBusyChange?: (busy: boolean) => void;
}) {
  const [images, setImages] = useState(initial);
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function setUploading(next: boolean) {
    setBusy(next);
    onBusyChange?.(next);
  }

  async function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    setUploading(true);
    const next = [...images];
    try {
      for (const file of Array.from(list)) {
        if (next.length >= MAX_PRODUCT_IMAGES) {
          setError(`Tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
          break;
        }
        const body = new FormData();
        body.set("image", file);
        const response = await fetch("/api/upload", { method: "POST", body });
        const data = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !data.url) {
          setError(data.error || "Không tải được ảnh.");
          break;
        }
        if (!next.includes(data.url)) next.push(data.url);
      }
      setImages(next);
    } catch {
      setError("Không tải được ảnh.");
    } finally {
      setUploading(false);
    }
  }

  function addLink() {
    const raw = link.trim();
    if (!raw) return;
    try {
      const url = new URL(raw);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
      if (images.length >= MAX_PRODUCT_IMAGES) {
        setError(`Tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
        return;
      }
      const href = url.toString();
      setError(null);
      if (!images.includes(href)) setImages([...images, href]);
      setLink("");
    } catch {
      setError("Link ảnh cần bắt đầu bằng http:// hoặc https://.");
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const current = next[index]!;
    next[index] = next[target]!;
    next[target] = current;
    setImages(next);
  }

  return (
    <div className="grid gap-2">
      {images.map((url, index) => (
        <input key={`${url}-${index}`} type="hidden" name="images" value={url} />
      ))}
      <Label>Ảnh</Label>
      <p className="text-xs text-[#5d7388]">Ảnh đầu tiên là ảnh bìa. Tối đa {MAX_PRODUCT_IMAGES} ảnh, mỗi ảnh 5 MB.</p>
      {images.length > 0 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <li key={`${url}-${index}`} className="w-24 shrink-0">
              <CardThumb src={url} alt="" className="h-28 w-full rounded-xl" />
              <p className="mt-1 text-center text-[11px] font-semibold text-[#5d7388]">{index === 0 ? "Bìa" : `Ảnh ${index + 1}`}</p>
              <div className="mt-1 flex justify-center gap-1">
                <button type="button" className="rounded-full px-2 py-0.5 text-xs ring-1 ring-[#d5e3f0]" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Đưa ảnh lên trước">
                  ←
                </button>
                <button type="button" className="rounded-full px-2 py-0.5 text-xs ring-1 ring-[#d5e3f0]" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label="Đưa ảnh ra sau">
                  →
                </button>
                <button type="button" className="rounded-full px-2 py-0.5 text-xs text-[#8a3b3b] ring-1 ring-[#d5e3f0]" onClick={() => setImages(images.filter((_, item) => item !== index))} aria-label="Xóa ảnh">
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={busy}
          className={field}
          onChange={(event) => {
            const files = event.target.files;
            void addFiles(files);
            event.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <Input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addLink();
              }
            }}
            placeholder="https://"
            className={field}
            aria-label="Link ảnh"
          />
          <button type="button" className="h-11 shrink-0 rounded-full bg-[#24344a] px-4 text-sm font-semibold text-white" onClick={addLink}>
            Thêm
          </button>
        </div>
      </div>
      {busy ? <p className="text-sm font-semibold text-[#3e5870]">Đang tải ảnh…</p> : null}
      {error ? <p className="text-sm font-semibold text-[#8a3b3b]">{error}</p> : null}
    </div>
  );
}
