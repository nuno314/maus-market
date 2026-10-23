"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { CardThumb } from "@/components/card-thumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_IMAGE_MB, MAX_PRODUCT_IMAGES } from "@/lib/images";
import { uploadProductImage } from "@/lib/upload-client";

const field = "h-11 rounded-xl bg-white";

type Draft = {
  id: string;
  preview: string;
  status: "uploading" | "queued";
};

export function ImageField({
  initial,
  onBusyChange,
}: {
  initial: string[];
  onBusyChange?: (busy: boolean) => void;
}) {
  const [images, setImages] = useState(initial);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  const previews = useRef<string[]>([]);

  useEffect(() => {
    const owned = previews.current;
    return () => {
      for (const url of owned) URL.revokeObjectURL(url);
    };
  }, []);

  function setUploading(next: boolean) {
    onBusyChange?.(next);
  }

  function dropDraft(id: string) {
    setDrafts((current) => {
      const draft = current.find((item) => item.id === id);
      if (draft) {
        URL.revokeObjectURL(draft.preview);
        previews.current = previews.current.filter((url) => url !== draft.preview);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  async function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    const room = MAX_PRODUCT_IMAGES - images.length - drafts.length;
    if (room <= 0) {
      setError(`Tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
      return;
    }
    const accepted = files.slice(0, room);
    if (accepted.length < files.length) setError(`Tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
    else setError(null);

    const incoming: Draft[] = accepted.map((file, index) => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      return {
        id: `${Date.now()}-${index}-${file.name}`,
        preview,
        status: "queued" as const,
      };
    });
    setDrafts((current) => [...current, ...incoming]);
    setUploading(true);
    try {
      for (let index = 0; index < accepted.length; index += 1) {
        const draft = incoming[index]!;
        const file = accepted[index]!;
        setDrafts((current) =>
          current.map((item) => (item.id === draft.id ? { ...item, status: "uploading" } : item)),
        );
        try {
          const url = await uploadProductImage(file);
          setImages((current) => (current.includes(url) ? current : [...current, url]));
        } catch (uploadError) {
          setError(uploadError instanceof Error ? uploadError.message : "Không tải được ảnh.");
          for (const pending of incoming.slice(index)) dropDraft(pending.id);
          return;
        }
        dropDraft(draft.id);
      }
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
      if (images.length + drafts.length >= MAX_PRODUCT_IMAGES) {
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

  function reorder(from: number, to: number) {
    if (from === to || to < 0 || to >= images.length) return;
    setImages((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      if (!item) return current;
      next.splice(to, 0, item);
      return next;
    });
  }

  const busy = drafts.length > 0;

  return (
    <div className="grid gap-2">
      {images.map((url, index) => (
        <input key={`${url}-${index}`} type="hidden" name="images" value={url} />
      ))}
      <Label>Ảnh</Label>
      <p className="text-xs text-[#5d7388]">
        Kéo ảnh để đổi thứ tự. Ảnh đầu tiên là ảnh bìa. Tối đa {MAX_PRODUCT_IMAGES} ảnh, mỗi ảnh {MAX_IMAGE_MB} MB.
      </p>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((url, index) => (
          <li
            key={`${url}-${index}`}
            draggable
            onDragStart={() => {
              dragRef.current = index;
              setDragIndex(index);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setOverIndex(index);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragRef.current !== null) reorder(dragRef.current, index);
              dragRef.current = null;
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              dragRef.current = null;
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`group relative cursor-grab overflow-hidden rounded-2xl bg-[#f7fbfe] ring-1 ring-[#d5e3f0] active:cursor-grabbing ${
              dragIndex === index ? "opacity-50" : ""
            } ${overIndex === index && dragIndex !== null && dragIndex !== index ? "ring-2 ring-[#1a4f86]" : ""}`}
          >
            <CardThumb src={url} alt="" className="aspect-[3/4] w-full" />
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#24344a] px-2 py-0.5 text-[10px] font-bold text-white">
              {index === 0 ? "Bìa" : index + 1}
            </span>
            <button
              type="button"
              className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-white text-[#8a3b3b] shadow-sm ring-1 ring-[#d5e3f0]"
              onClick={() => setImages((current) => current.filter((_, item) => item !== index))}
              aria-label="Xóa ảnh"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
        {drafts.map((draft) => (
          <li key={draft.id} className="relative overflow-hidden rounded-2xl bg-[#f7fbfe] ring-1 ring-[#d5e3f0]">
            {/* Local preview while the file is still uploading. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.preview} alt="" className="aspect-[3/4] w-full object-cover" />
            <div className="absolute inset-0 grid place-items-center bg-[#24344a]/45 text-white">
              {draft.status === "uploading" ? (
                <span className="grid place-items-center gap-1">
                  <Loader2 className="size-7 animate-spin" aria-hidden />
                  <span className="text-[11px] font-semibold">Đang tải</span>
                </span>
              ) : (
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[#3e5870]">Chờ</span>
              )}
            </div>
          </li>
        ))}
        {images.length + drafts.length < MAX_PRODUCT_IMAGES ? (
          <li>
            <label
              className={`grid aspect-[3/4] cursor-pointer place-items-center gap-1 rounded-2xl border border-dashed border-[#8eb8d6] bg-[#f7fbfe] text-[#1a4f86] ${
                busy ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Plus className="size-7" aria-hidden />
              <span className="text-xs font-semibold">Thêm ảnh</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={busy}
                className="sr-only"
                onChange={(event) => {
                  void addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
          </li>
        ) : null}
      </ul>
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
      {error ? <p className="text-sm font-semibold text-[#8a3b3b]">{error}</p> : null}
    </div>
  );
}
