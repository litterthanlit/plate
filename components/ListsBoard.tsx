"use client";

import Link from "next/link";
import { placesOnList } from "@/lib/diary";
import { LISTS } from "@/lib/lists";
import { stars } from "@/lib/diary";
import { useDiary } from "@/lib/use-diary";

export function ListsBoard() {
  const { ready, visits, places } = useDiary();

  if (!ready) {
    return <p className="text-sm text-ink/50">Sorting tabs…</p>;
  }

  return (
    <div className="space-y-8">
      {LISTS.map((list) => {
        const items = placesOnList(visits, places, list.id);
        return (
          <section key={list.id}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">
              {list.label}
            </h2>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ink/45">
              {list.hint}
            </p>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-ink/50">Empty. Tag a visit.</p>
            ) : (
              <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
                {items.map(({ place, latest }) => (
                  <li
                    key={place.id}
                    className="flex items-baseline justify-between gap-3 py-2"
                  >
                    <div>
                      <p>{place.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-ink/45">
                        {place.neighborhood}
                        {latest.note ? ` · ${latest.note}` : ""}
                      </p>
                    </div>
                    <span className="text-sm tracking-widest">
                      {stars(latest.rating)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      <Link href="/log" className="stamp-btn">
        Log another
      </Link>
    </div>
  );
}
