"use client";

import { PlaceAutocomplete } from "@/components/PlaceAutocomplete";
import { PlaceMeta } from "@/components/PlaceMeta";
import { PlaceThumb } from "@/components/PlaceThumb";
import type { Place } from "@/lib/types";
import type { NewPlaceInput } from "@/lib/use-diary";

type PlaceSearchProps = {
  places: Place[];
  selected: Place | null;
  onSelect: (place: Place) => void;
  onClear: () => void;
  onCreate: (input: NewPlaceInput) => Place;
};

export function PlaceSearch({
  places,
  selected,
  onSelect,
  onClear,
  onCreate,
}: PlaceSearchProps) {
  if (selected) {
    return (
      <div className="flex items-start justify-between gap-3 border border-ink/20 bg-paper-2 px-3 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <PlaceThumb place={selected} />
          <div className="min-w-0">
            <p className="font-medium">{selected.name}</p>
            <p className="mt-0.5">
              <PlaceMeta place={selected} />
            </p>
          </div>
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
      <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-ink/55">
        Place
      </p>
      <PlaceAutocomplete
        places={places}
        addPlace={onCreate}
        onPick={onSelect}
      />
    </div>
  );
}
