"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { createBulkCardsAction } from "@/app/actions/admin";
import { CardThumb } from "@/components/card-thumb";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONDITIONS, ERAS, SEASONS, type Condition } from "@/lib/sets";
import { imageFileError, uploadProductImage } from "@/lib/upload-client";

const field = "h-11 rounded-xl bg-white";
const selectClass = `${field} w-full border border-[#d5e3f0] px-3`;
const MAX_BULK_CARDS = 40;

type DraftCard = {
  id: string;
  file: File;
  preview: string;
  url: string;
  phase: "idle" | "uploading" | "queued";
  name: string;
  price: string;
  quantity: string;
  setId: string;
  condition: Condition;
};

function nameFromFile(file: File) {
  return file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function BulkCardForm() {
  const [state, action] = useActionState(createBulkCardsAction, null);
  const [rows, setRows] = useState<DraftCard[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rowsRef = useRef(rows);
  const passSubmit = useRef(false);
  const resumeForm = useRef<HTMLFormElement | null>(null);
  rowsRef.current = rows;

  useEffect(() => {
    const form = resumeForm.current;
    if (!form || rows.some((row) => !row.url)) return;
    resumeForm.current = null;
    passSubmit.current = true;
    form.requestSubmit();
  }, [rows]);

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    const next = [...rows];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_BULK_CARDS) {
        setError(`Mỗi lần đăng tối đa ${MAX_BULK_CARDS} thẻ.`);
        break;
      }
      const problem = imageFileError(file);
      if (problem) {
        setError(problem);
        break;
      }
      next.push({
        id: `${Date.now()}-${next.length}-${file.name}`,
        file,
        preview: URL.createObjectURL(file),
        url: "",
        phase: "idle",
        name: nameFromFile(file),
        price: "",
        quantity: "1",
        setId: SEASONS[0]?.key ?? "",
        condition: "A",
      });
    }
    setRows(next);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (passSubmit.current) {
      passSubmit.current = false;
      return;
    }
    const current = rowsRef.current;
    if (!current.some((row) => !row.url)) return;
    event.preventDefault();
    const form = event.currentTarget;
    setUploading(true);
    setError(null);
    const next = [...current];
    try {
      for (let index = 0; index < next.length; index += 1) {
        const row = next[index]!;
        if (row.url) continue;
        const activeId = row.id;
        setRows((items) =>
          items.map((item) => {
            if (item.url) return item;
            if (item.id === activeId) return { ...item, phase: "uploading" };
            const waiting = next.slice(index + 1).some((later) => !later.url && later.id === item.id);
            return waiting ? { ...item, phase: "queued" } : item;
          }),
        );
        const url = await uploadProductImage(row.file);
        next[index] = { ...row, url, phase: "idle" };
      }
      resumeForm.current = form;
      setRows(next);
    } catch (uploadError) {
      setRows(next.map((row) => ({ ...row, phase: "idle" })));
      setError(uploadError instanceof Error ? uploadError.message : "Không tải được ảnh.");
    } finally {
      setUploading(false);
    }
  }

  function updateRow(id: string, patch: Partial<Pick<DraftCard, "name" | "price" | "quantity" | "setId" | "condition">>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <section className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
      <h2 className="font-extrabold">Đăng nhiều thẻ</h2>
      <p className="mt-1 text-sm text-[#5d7388]">
        Bấm dấu cộng để chọn nhiều ảnh. Ảnh nằm trên máy cho đến khi bấm đăng. Mỗi thẻ chọn mùa, condition, tên, số lượng và giá riêng.
      </p>
      <form action={action} className="mt-3 grid gap-3" onSubmit={onSubmit}>
        <label
          htmlFor="bulk-images"
          className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[#8eb8d6] bg-[#f7fbfe] text-[#1a4f86] ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <Plus className="size-8" aria-hidden />
          <span className="text-sm font-semibold">{uploading ? "Đang tải ảnh…" : "Thêm nhiều thẻ"}</span>
        </label>
        <input
          id="bulk-images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={uploading}
          className="sr-only"
          onChange={(event) => {
            void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        {rows.length > 0 ? (
          <ul className="grid gap-3">
            {rows.map((row, index) => (
              <li key={row.id} className="grid gap-3 rounded-2xl bg-[#f7fbfe] p-3 ring-1 ring-[#d5e3f0] sm:grid-cols-[5.5rem_1fr_auto]">
                {row.url ? <input type="hidden" name="image" value={row.url} /> : null}
                <div className="relative">
                  <CardThumb src={row.url || row.preview} alt="" className="h-24 w-[4.5rem] rounded-xl" />
                  {row.phase === "idle" && !row.url ? (
                    <span className="absolute bottom-1 left-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-[#1a4f86]">Máy</span>
                  ) : null}
                  {row.phase !== "idle" ? (
                    <div className="absolute inset-0 grid place-items-center rounded-xl bg-[#24344a]/45 text-white">
                      {row.phase === "uploading" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <span className="text-[10px] font-bold">Chờ</span>}
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <Label htmlFor={`bulk-set-${row.id}`}>Mùa</Label>
                    <select
                      id={`bulk-set-${row.id}`}
                      name="setId"
                      className={selectClass}
                      value={row.setId}
                      onChange={(event) => updateRow(row.id, { setId: event.target.value })}
                      required
                    >
                      {ERAS.map((era) => {
                        const seasons = SEASONS.filter((item) => item.era === era.id);
                        if (seasons.length === 0) return null;
                        return (
                          <optgroup key={era.id} label={era.label}>
                            {seasons.map((item) => (
                              <option key={item.key} value={item.key}>
                                {item.label}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`bulk-condition-${row.id}`}>Condition</Label>
                    <select
                      id={`bulk-condition-${row.id}`}
                      name="condition"
                      className={selectClass}
                      value={row.condition}
                      onChange={(event) => updateRow(row.id, { condition: event.target.value as Condition })}
                      required
                    >
                      {CONDITIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_9rem_5.5rem]">
                    <div className="grid gap-1">
                      <Label htmlFor={`bulk-name-${row.id}`}>Tên thẻ {index + 1}</Label>
                      <Input
                        id={`bulk-name-${row.id}`}
                        name="name"
                        required
                        value={row.name}
                        onChange={(event) => updateRow(row.id, { name: event.target.value })}
                        className={field}
                        placeholder="Charizard ex"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`bulk-price-${row.id}`}>Giá bán (VND)</Label>
                      <Input
                        id={`bulk-price-${row.id}`}
                        name="priceVnd"
                        inputMode="numeric"
                        required
                        value={row.price}
                        onChange={(event) => updateRow(row.id, { price: event.target.value })}
                        className={field}
                        placeholder="150000"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`bulk-qty-${row.id}`}>Số lượng</Label>
                      <Input
                        id={`bulk-qty-${row.id}`}
                        name="quantity"
                        type="number"
                        min={1}
                        max={99}
                        required
                        value={row.quantity}
                        onChange={(event) => updateRow(row.id, { quantity: event.target.value })}
                        className={field}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="h-10 self-end rounded-full px-3 text-sm font-semibold text-[#8a3b3b] ring-1 ring-[#d5e3f0]"
                  onClick={() => {
                    URL.revokeObjectURL(row.preview);
                    setRows((current) => current.filter((item) => item.id !== row.id));
                  }}
                >
                  Bỏ
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {error ? <p className="text-sm font-semibold text-[#8a3b3b]">{error}</p> : null}
        {state?.error ? <p className="text-sm font-semibold text-[#8a3b3b]">{state.error}</p> : null}
        <SubmitButton className="h-11 rounded-full" disabled={uploading || rows.length === 0} pendingLabel="Đang đăng…">
          Đăng {rows.length > 0 ? `${rows.length} thẻ` : "thẻ"}
        </SubmitButton>
      </form>
    </section>
  );
}
