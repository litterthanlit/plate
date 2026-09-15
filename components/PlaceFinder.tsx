"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { METRO, searchPlaces } from "@/lib/places";
import { useDiary } from "@/lib/use-diary";

export function PlaceFinder() {
  const router = useRouter();
  const { ready, places, addPlace } = useDiary();
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => searchPlaces(places, query),
    [places, query],
  );

  if (!ready) {
    return <p className="text-sm text-ink/50">Flipping the book…</p>;
  }

  const needle = query.trim();
  const canAdd =
    needle.length > 0 &&
    !places.some((place) => place.name.toLowerCase() === needle.toLowerCase());

  return (
    <div className="space-y-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50">
        {METRO} · nearby
      </p>
      <input
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="search a place"
        className="w-full border border-ink/25 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink/35 focus:border-ink"
      />
      {canAdd ? (
        <button
          type="button"
          onClick={() => {
            const place = addPlace({ name: needle });
            router.push(`/log?place=${encodeURIComponent(place.id)}`);
          }}
          className="w-full border border-dashed border-ink/35 px-3 py-2 text-left text-sm hover:bg-paper-2"
        >
          Add “{needle}” then log it
        </button>
      ) : null}
      <ul className="divide-y divide-ink/10 border-y border-ink/15">
        {results.map((place) => (
          <li key={place.id}>
            <Link
              href={`/log?place=${encodeURIComponent(place.id)}`}
              className="flex items-baseline justify-between gap-3 py-2.5 hover:bg-paper-2"
            >
              <span>
                <span className="block">{place.name}</span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-ink/45">
                  {place.neighborhood} · {place.cuisine}
                </span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                log →
              </span>
            </Link>
          </li>
        ))}
        {results.length === 0 ? (
          <li className="py-3 text-sm text-ink/50">No places match.</li>
        ) : null}
      </ul>
    </div>
  );
}
