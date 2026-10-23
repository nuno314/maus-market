"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { CardThumb } from "@/components/card-thumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_IMAGE_MB, MAX_PRODUCT_IMAGES } from "@/lib/images";
import { imageFileError, uploadProductImage } from "@/lib/upload-client";

const field = "h-11 rounded-xl bg-white";

type SavedPhoto = { id: string; kind: "saved"; url: string };
type LocalPhoto = { id: string; kind: "local"; file: File; preview: string; phase: "idle" | "uploading" | "queued" };
type Photo = SavedPhoto | LocalPhoto;

export type ImageFieldHandle = {
  hasLocal: () => boolean;
  flush: () => Promise<void>;
};

export function ImageField({
  ref,
  initial,
}: {
  ref?: Ref<ImageFieldHandle>;
  initial: string[];
}) {
  const [photos, setPhotos] = useState<Photo[]>(() =>
    initial.filter(Boolean).map((url, index) => ({ id: `saved-${index}-${url}`, kind: "saved", url })),
  );
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  const photosRef = useRef(photos);
  const previews = useRef<string[]>([]);
  const commitWait = useRef<(() => void) | null>(null);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  photosRef.current = photos;

  useEffect(() => {
    commitWait.current?.();
    commitWait.current = null;
  }, [photos]);

  useEffect(() => {
    const owned = previews.current;
    return () => {
      for (const url of owned) URL.revokeObjectURL(url);
    };
  }, []);

  function rememberPreview(preview: string) {
    previews.current.push(preview);
  }

  function forgetPreview(preview: string) {
    URL.revokeObjectURL(preview);
    previews.current = previews.current.filter((url) => url !== preview);
  }

  async function flush() {
    const current = photosRef.current;
    if (!current.some((photo) => photo.kind === "local")) return;
    const next: Photo[] = [];
    let index = 0;
    try {
      for (; index < current.length; index += 1) {
        const photo = current[index]!;
        if (photo.kind === "saved") {
          next.push(photo);
          continue;
        }
        const activeId = photo.id;
        setPhotos((items) =>
          items.map((item) => {
            if (item.kind !== "local") return item;
            if (item.id === activeId) return { ...item, phase: "uploading" };
            const stillWaiting = current.slice(index + 1).some((later) => later.kind === "local" && later.id === item.id);
            return stillWaiting ? { ...item, phase: "queued" } : item;
          }),
        );
        const url = await uploadProductImage(photo.file);
        forgetPreview(photo.preview);
        next.push({ id: photo.id, kind: "saved", url });
      }
      await new Promise<void>((resolve) => {
        commitWait.current = resolve;
        setPhotos(next);
      });
    } catch (uploadError) {
      const rest = current.slice(index).map((photo) => (photo.kind === "local" ? { ...photo, phase: "idle" as const } : photo));
      setPhotos([...next, ...rest]);
      const message = uploadError instanceof Error ? uploadError.message : "Không tải được ảnh.";
      setError(message);
      throw new Error(message);
    }
  }

  flushRef.current = flush;

  useImperativeHandle(ref, () => ({
    hasLocal: () => photosRef.current.some((photo) => photo.kind === "local"),
    flush: () => flushRef.current(),
  }));

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const room = MAX_PRODUCT_IMAGES - photos.length;
    if (room <= 0) {
      setError(`Tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
      return;
    }
    const accepted = Array.from(list).slice(0, room);
    if (accepted.length < list.length) setError(`Tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
    else setError(null);
    const incoming: LocalPhoto[] = [];
    for (const [index, file] of accepted.entries()) {
      const problem = imageFileError(file);
      if (problem) {
        setError(problem);
        break;
      }
      const preview = URL.createObjectURL(file);
      rememberPreview(preview);
      incoming.push({
        id: `${Date.now()}-${index}-${file.name}`,
        kind: "local",
        file,
        preview,
        phase: "idle",
      });
    }
    if (incoming.length > 0) setPhotos((current) => [...current, ...incoming]);
  }

  function addLink() {
    const raw = link.trim();
    if (!raw) return;
    try {
      const url = new URL(raw);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
      if (photos.length >= MAX_PRODUCT_IMAGES) {
        setError(`Tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
        return;
      }
      const href = url.toString();
      setError(null);
      if (!photos.some((photo) => photo.kind === "saved" && photo.url === href)) {
        setPhotos((current) => [...current, { id: `link-${href}`, kind: "saved", url: href }]);
      }
      setLink("");
    } catch {
      setError("Link ảnh cần bắt đầu bằng http:// hoặc https://.");
    }
  }

  function removeAt(index: number) {
    const photo = photos[index];
    if (photo?.kind === "local") forgetPreview(photo.preview);
    setPhotos((current) => current.filter((_, item) => item !== index));
  }

  function reorder(from: number, to: number) {
    if (from === to || to < 0 || to >= photos.length) return;
    setPhotos((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      if (!item) return current;
      next.splice(to, 0, item);
      return next;
    });
  }

  const saving = photos.some((photo) => photo.kind === "local" && photo.phase !== "idle");

  return (
    <div className="grid gap-2">
      {photos.map((photo, index) =>
        photo.kind === "saved" ? <input key={photo.id} type="hidden" name="images" value={photo.url} /> : null,
      )}
      <Label>Ảnh</Label>
      <p className="text-xs text-[#5d7388]">
        Kéo để đổi thứ tự. Ảnh đầu tiên là ảnh bìa. Tối đa {MAX_PRODUCT_IMAGES} ảnh, mỗi ảnh {MAX_IMAGE_MB} MB.
      </p>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((photo, index) => {
          const src = photo.kind === "saved" ? photo.url : photo.preview;
          return (
            <li
              key={photo.id}
              draggable={!saving}
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
              <CardThumb src={src} alt="" className="aspect-[3/4] w-full" />
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#24344a] px-2 py-0.5 text-[10px] font-bold text-white">
                {index === 0 ? "Bìa" : index + 1}
              </span>
              {photo.kind === "local" && photo.phase !== "idle" ? (
                <div className="absolute inset-0 grid place-items-center bg-[#24344a]/45 text-white">
                  {photo.phase === "uploading" ? (
                    <span className="grid place-items-center gap-1">
                      <Loader2 className="size-7 animate-spin" aria-hidden />
                      <span className="text-[11px] font-semibold">Đang lưu</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[#3e5870]">Chờ</span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-white text-[#8a3b3b] shadow-sm ring-1 ring-[#d5e3f0]"
                  onClick={() => removeAt(index)}
                  aria-label="Xóa ảnh"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          );
        })}
        {photos.length < MAX_PRODUCT_IMAGES ? (
          <li>
            <label
              className={`grid aspect-[3/4] cursor-pointer place-items-center gap-1 rounded-2xl border border-dashed border-[#8eb8d6] bg-[#f7fbfe] text-[#1a4f86] ${
                saving ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Plus className="size-7" aria-hidden />
              <span className="text-xs font-semibold">Thêm ảnh</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={saving}
                className="sr-only"
                onChange={(event) => {
                  addFiles(event.target.files);
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
