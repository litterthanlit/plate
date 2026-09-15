"use client";

import { useMemo, useState } from "react";
import { searchPlaces } from "@/lib/places";
import type { Place } from "@/lib/types";

type PlaceSearchProps = {
  places: Place[];
  selected: Place | null;
  onSelect: (place: Place) => void;
  onClear: () => void;
  onCreate: (name: string) => Place;
};

export function PlaceSearch({
  places,
  selected,
  onSelect,
  onClear,
  onCreate,
}: PlaceSearchProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => searchPlaces(places, query).slice(0, 8),
    [places, query],
  );

  const exact = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return places.some((place) => place.name.toLowerCase() === needle);
  }, [places, query]);

  if (selected) {
    return (
      <div className="flex items-start justify-between gap-3 border border-ink/20 bg-paper-2 px-3 py-3">
        <div>
          <p className="font-medium">{selected.name}</p>
          <p className="text-xs uppercase tracking-[0.14em] text-ink/50">
            {selected.neighborhood} · {selected.cuisine}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] uppercase tracking-[0.18em] text-ink/55 hover:text-ink"
        >
          change
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-ink/55">
        Place
      </label>
      <input
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="name, neighborhood, food"
        className="w-full border border-ink/25 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink/35 focus:border-ink"
      />
      <ul className="mt-2 divide-y divide-ink/10 border border-ink/15">
        {results.map((place) => (
          <li key={place.id}>
            <button
              type="button"
              onClick={() => {
                onSelect(place);
                setQuery("");
              }}
              className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-paper-2"
            >
              <span>{place.name}</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-ink/45">
                {place.neighborhood}
              </span>
            </button>
          </li>
        ))}
        {results.length === 0 ? (
          <li className="px-3 py-2 text-sm text-ink/50">No matches in the book.</li>
        ) : null}
      </ul>
      {!exact && query.trim() ? (
        <button
          type="button"
          onClick={() => {
            const place = onCreate(query.trim());
            onSelect(place);
            setQuery("");
          }}
          className="mt-2 w-full border border-dashed border-ink/35 px-3 py-2 text-left text-sm hover:bg-paper-2"
        >
          Add “{query.trim()}” as a new place
        </button>
      ) : null}
    </div>
  );
}
