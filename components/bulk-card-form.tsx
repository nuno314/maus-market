"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createBulkCardsAction } from "@/app/actions/admin";
import { CardThumb } from "@/components/card-thumb";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONDITIONS, ERAS, SEASONS, type Condition } from "@/lib/sets";

const field = "h-11 rounded-xl bg-white";
const selectClass = `${field} w-full border border-[#d5e3f0] px-3`;
const MAX_BULK_CARDS = 40;

type DraftCard = {
  id: string;
  url: string;
  name: string;
  price: string;
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

  async function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    setUploading(true);
    const next = [...rows];
    try {
      for (const file of Array.from(list)) {
        if (next.length >= MAX_BULK_CARDS) {
          setError(`Mỗi lần đăng tối đa ${MAX_BULK_CARDS} thẻ.`);
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
        next.push({
          id: `${Date.now()}-${next.length}-${file.name}`,
          url: data.url,
          name: nameFromFile(file),
          price: "",
          setId: SEASONS[0]?.key ?? "",
          condition: "A",
        });
      }
      setRows(next);
    } catch {
      setError("Không tải được ảnh.");
    } finally {
      setUploading(false);
    }
  }

  function updateRow(id: string, patch: Partial<Pick<DraftCard, "name" | "price" | "setId" | "condition">>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <section className="rounded-3xl bg-white p-4 ring-1 ring-[#d5e3f0] sm:p-5">
      <h2 className="font-extrabold">Đăng nhiều thẻ</h2>
      <p className="mt-1 text-sm text-[#5d7388]">
        Bấm dấu cộng để tải nhiều ảnh một lúc. Mỗi thẻ chọn mùa, condition, tên và giá riêng. Số lượng mỗi thẻ là 1.
      </p>
      <form action={action} className="mt-3 grid gap-3">
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
                <input type="hidden" name="image" value={row.url} />
                <CardThumb src={row.url} alt="" className="h-24 w-[4.5rem] rounded-xl" />
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
                  <div className="grid gap-2 sm:grid-cols-2">
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
                  </div>
                </div>
                <button
                  type="button"
                  className="h-10 self-end rounded-full px-3 text-sm font-semibold text-[#8a3b3b] ring-1 ring-[#d5e3f0]"
                  onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
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
