"use client";

import { LISTS } from "@/lib/lists";
import { toggleListId } from "@/lib/diary";
import type { ListId } from "@/lib/types";

export function ListToggles({
  value,
  onChange,
}: {
  value: ListId[];
  onChange: (next: ListId[]) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink/55">
        Lists
      </p>
      <div className="flex flex-wrap gap-2">
        {LISTS.map((list) => {
          const on = value.includes(list.id);
          return (
            <button
              key={list.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(toggleListId(value, list.id))}
              className={`border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
                on
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/30 text-ink/70 hover:border-ink"
              }`}
            >
              {list.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
