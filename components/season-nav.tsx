"use client";

import { useState } from "react";
import { ERAS, type Era } from "@/lib/sets";

type SeasonItem = {
  key: string;
  era: Era;
  label: string;
};

export function SeasonNav({
  seasons,
  value,
  onChange,
  allowAll = false,
}: {
  seasons: SeasonItem[];
  value: string;
  onChange: (key: string) => void;
  allowAll?: boolean;
}) {
  const [openEra, setOpenEra] = useState<Era | null>(null);
  const selected = seasons.find((item) => item.key === value);

  function toggle(era: Era) {
    setOpenEra((current) => (current === era ? null : era));
  }

  function choose(key: string) {
    onChange(key);
    setOpenEra(null);
  }

  const openSeasons = openEra ? seasons.filter((item) => item.era === openEra) : [];

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chọn era">
        {allowAll ? (
          <button
            type="button"
            onClick={() => choose("all")}
            className={navClass(value === "all")}
          >
            Mọi mùa
          </button>
        ) : null}
        {ERAS.map((era) => {
          const count = seasons.filter((item) => item.era === era.id).length;
          if (count === 0) return null;
          const active = openEra === era.id || selected?.era === era.id;
          return (
            <button key={era.id} type="button" aria-expanded={openEra === era.id} onClick={() => toggle(era.id)} className={navClass(active)}>
              {era.label}
            </button>
          );
        })}
      </div>
      {selected && value !== "all" ? <p className="mt-2 text-sm font-semibold text-[#1a4f86]">{selected.label}</p> : null}
      {openEra && openSeasons.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Danh sách mùa">
          {openSeasons.map((item) => (
            <button key={item.key} type="button" onClick={() => choose(item.key)} className={chipClass(item.key === value)}>
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function navClass(active: boolean) {
  return `rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${
    active ? "bg-[#24344a] text-white ring-[#24344a]" : "bg-white text-[#3e5870] ring-[#d5e3f0]"
  }`;
}

function chipClass(active: boolean) {
  return `rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${
    active ? "bg-[#d7ebf8] text-[#1a4f86] ring-[#9ec7e8]" : "bg-white text-[#3e5870] ring-[#d5e3f0]"
  }`;
}
